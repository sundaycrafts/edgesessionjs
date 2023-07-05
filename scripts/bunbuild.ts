#!/usr/bin/env bun

import * as fs from "fs/promises";
import * as path from "path";

const absBasePath = path.join(process.cwd(), process.argv[2] || "./");

export type TsConfig = {
  compilerOptions: {
    rootDir: string;
    outDir: string;
  };
};

export type Pkg = {
  exports: { [key: string]: string };
  peerDependencies: { [key: string]: string };
  scripts: { [key: string]: string };
  files: string[];
};

export type Ok<D> = {
  success: true;
  data: D;
};

export type Err<E> = {
  success: false;
  error: E;
};

export type Result<Data, Error> = Ok<Data> | Err<Error>;

export function tri<E, Out, In extends any[] = never[]>(
  fn: (...i: In) => Out | Promise<Out>
): (...i: In) => Promise<Result<Out, E>> {
  return async (...i: In) => {
    try {
      const data = await fn(...i);
      return { success: true, data: data };
    } catch (e) {
      return { success: false, error: e as E };
    }
  };
}

const { default: tsconfig } = (await import(
  path.join(absBasePath, "tsconfig.json")
)) as { default: TsConfig };
const { default: pkg } = (await import(
  path.join(absBasePath, "package.json")
)) as {
  default: Pkg;
};

console.log(`cleaning up ${tsconfig.compilerOptions.outDir} ...`);
await fs.rm(tsconfig.compilerOptions.outDir, { recursive: true, force: true });

const pkgFiles = pkg.files || [];
await Promise.all(
  ["LICENSE", "README.md", ...pkgFiles].map(async (filename) => {
    const filepath = path.join(absBasePath, filename);
    if (!(await fs.exists(filepath))) return;

    const dest = path.join(
      absBasePath,
      tsconfig.compilerOptions.outDir,
      filename
    );
    console.log(
      `copying ${filename} to ${tsconfig.compilerOptions.outDir} ...`
    );
    await fs.mkdir(path.dirname(dest), { recursive: true });
    return fs.copyFile(filepath, dest);
  })
);

const built = await Bun.build({
  entrypoints: Object.values(pkg.exports).map((filepath) =>
    path.join(absBasePath, filepath)
  ),
  outdir: tsconfig.compilerOptions.outDir,
  minify: false,
  target: "node",
  splitting: true,
  naming: "[dir]/[name].[ext]",
  external: Object.keys(pkg.peerDependencies),
});
if (!built.success) {
  console.error("failed to build");
  process.exit(1);
}

const wrote = await tri<Error, void>(() => {
  console.log("writing package.json...");
  console.log("omitting scripts...");

  return fs.writeFile(
    path.join(absBasePath, tsconfig.compilerOptions.outDir, "package.json"),
    JSON.stringify(
      {
        ...pkg,
        scripts: undefined,
        exports: Object.entries(pkg.exports).reduce(
          (acc, [key, filepath]) => ({
            ...acc,
            [key]: path.join(
              path
                .dirname(filepath)
                .split(path.sep)
                .filter(
                  (node) =>
                    path.normalize(node) !==
                    path.normalize(tsconfig.compilerOptions.rootDir)
                )
                .join(path.sep),
              path.basename(filepath, path.extname(filepath)) + ".js"
            ),
          }),
          {} as { [key: string]: string }
        ),
      },
      null,
      2
    )
  );
})();
if (!wrote.success) {
  console.error("failed to write package.json");
  process.exit(1);
}
