import { expect, test } from "bun:test";
import { Signature } from "./signature";

test("message is signed by deterministic algorithm", async () => {
  const sig = new Signature("secret");

  const signed = await sig.sign("hello");
  expect(signed).toEqual(
    "hello.861d2f3811d6eabaac548704d98077e7050e94e1a8f6eb0fdadd78cfebef1f57"
  );
});

test("message is unsigned", async () => {
  const sig = new Signature("secret");
  const signed = await sig.sign("hello");
  expect(await sig.unsign(signed)).toEqual({ success: true, data: "hello" });
});

test("unsign() returns error when given invalid signature", async () => {
  const sig = new Signature("secret");
  expect(await sig.unsign("hello.invalidsig")).toEqual({
    success: false,
    error: expect.any(Error),
  });
});
