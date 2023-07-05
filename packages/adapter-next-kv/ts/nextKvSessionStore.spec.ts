import { test } from "bun:test";
import { NextKvSessionStore } from "./nextKvSessionStore";

test("nextKvSessionStore should be passed type check", async () => {
  new NextKvSessionStore(null as any);
});
