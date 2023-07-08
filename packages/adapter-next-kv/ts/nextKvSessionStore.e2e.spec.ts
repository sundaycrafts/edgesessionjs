import { expect, test } from "bun:test";
import { NextKvSessionStore } from "./nextKvSessionStore";
import { EdgeSession, SessionState, Signature } from "edgesession";
import { kv } from "@vercel/kv";
import { MockRequestCookies } from "./__fixtures__/mockRequestCookies";
import { MockResponseCookies } from "./__fixtures__/mockResponseCookies";

function setup() {
  const cookieStore = {};

  return {
    session: new EdgeSession(
      new Signature("secret"),
      new NextKvSessionStore(kv)
    ),
    requestCookies: new MockRequestCookies(cookieStore),
    responseCookies: new MockResponseCookies(cookieStore),
  };
}

interface StateObj
  extends SessionState<"state_obj", { foo: string; bar: number }> {}

test("nextKvSessionStore should store JSON object", async () => {
  const { session, responseCookies } = setup();

  await session.commit<StateObj>(responseCookies, "state_obj", {
    foo: "bar",
    bar: 1,
  });

  expect(await session.get<StateObj>(responseCookies, "state_obj")).toEqual({
    success: true,
    data: { foo: "bar", bar: 1 },
  });
});

test("nextKvSessionStore should return undefined if the value is not exists", async () => {
  const { session, responseCookies } = setup();

  expect(await session.get<StateObj>(responseCookies, "state_obj")).toEqual({
    success: true,
    data: undefined,
  });
});
