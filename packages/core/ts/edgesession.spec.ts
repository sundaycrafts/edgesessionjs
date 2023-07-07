import { expect, test } from "bun:test";
import { EdgeSession } from "./edgesession";
import { Signature } from "./signature";
import { SessionState } from "./sessionState";
import { MockSessionStore } from "./__fixtures__/mockSessionStore";
import { MockRequestCookies } from "./__fixtures__/mockRequestCookies";
import { MockResponseCookies } from "./__fixtures__/mockResponseCookies";

function setup(fail: boolean) {
  const cookieStore = {};
  const sessionStore = new MockSessionStore(fail);

  return {
    session: new EdgeSession(new Signature("secret"), sessionStore),
    sessionStore,
    requestCookies: new MockRequestCookies(cookieStore),
    responseCookies: new MockResponseCookies(cookieStore),
  };
}

interface StateBool extends SessionState<"state_bool", boolean> {}
interface StateNum extends SessionState<"state_num", number> {}
interface StateStr extends SessionState<"state_str", string> {}
interface StateObj extends SessionState<"state_obj", { foo: "bar" }> {}
interface StateArr
  extends SessionState<"state_arr", { foo: string; bar: number }[]> {}
interface FlashBool extends SessionState<"flash_bool", boolean, true> {}
interface FlashNum extends SessionState<"flash_num", number, true> {}
interface FlashStr extends SessionState<"flash_str", string, true> {}
interface FlashObj extends SessionState<"flash_obj", { foo: "bar" }, true> {}
interface FlashArr
  extends SessionState<"flash_arr", { foo: string; bar: number }[], true> {}

test("edgesession.get() should return undefined if the session does not exist", async () => {
  const { session, requestCookies } = setup(false);
  expect(await session.get<StateBool>(requestCookies, "state_bool")).toEqual({
    success: true,
    data: undefined,
  });
});

test("edgesession.get() should return the session value if the session exists", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commit<StateBool>(responseCookies, "state_bool", true);
  expect(await session.get<StateBool>(requestCookies, "state_bool")).toEqual({
    success: true,
    data: true,
  });
});

test("edgesession.get() should return a JSON object if it was committed", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commit<StateObj>(responseCookies, "state_obj", { foo: "bar" });
  expect(await session.get<StateObj>(requestCookies, "state_obj")).toEqual({
    success: true,
    data: { foo: "bar" },
  });
});

test("edgesession.get() should return a JSON array if it was committed", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commit<StateArr>(responseCookies, "state_arr", [
    { foo: "bar", bar: 1 },
    { foo: "baz", bar: 2 },
  ]);
  expect(await session.get<StateArr>(requestCookies, "state_arr")).toEqual({
    success: true,
    data: [
      { foo: "bar", bar: 1 },
      { foo: "baz", bar: 2 },
    ],
  });
});

test("edgesession.get() should return the session value even if it is a falsy (false)", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commit<StateBool>(responseCookies, "state_bool", false);
  expect(await session.get<StateBool>(requestCookies, "state_bool")).toEqual({
    success: true,
    data: false,
  });
});

test("edgesession.get() should return the session value even if it is a falsy (0)", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commit<StateNum>(responseCookies, "state_num", 0);
  expect(await session.get<StateNum>(requestCookies, "state_num")).toEqual({
    success: true,
    data: 0,
  });
});

test("edgesession.get() should return the session value even if it is a falsy (blank string)", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commit<StateStr>(responseCookies, "state_str", "");
  expect(await session.get<StateStr>(requestCookies, "state_str")).toEqual({
    success: true,
    data: "",
  });
});

test("edgesession.commit() should delete store data if given value is null", async () => {
  const { session, sessionStore, responseCookies } = setup(false);
  await session.commit<StateBool>(responseCookies, "state_bool", null);
  expect(sessionStore.spy.del.hasBeenCalledNth()).toEqual(1);
});

test("edgesession.destroy() should delete session cookie", async () => {
  const { session, responseCookies } = setup(false);
  await session.commit<StateBool>(responseCookies, "state_bool", true);
  await session.destroy(responseCookies);
  expect(responseCookies.spy.delete.hasBeenCalledNth()).toEqual(1);
});

test("edgesession.destroy() should do nothing if session does not exist", async () => {
  const { session, responseCookies } = setup(false);
  await session.destroy(responseCookies);
  expect(responseCookies.spy.delete.hasBeenCalledNth()).toEqual(0);
});

test("edgesession.commitFlash() should delete store data if given value is null", async () => {
  const { session, sessionStore, responseCookies } = setup(false);
  await session.commitFlash<FlashBool>(responseCookies, "flash_bool", true);
  await session.commitFlash<FlashBool>(responseCookies, "flash_bool", null);
  expect(sessionStore.spy.del.hasBeenCalledNth()).toEqual(1);
});

test("edgesession.hasFlash() should return false if the session does not exist", async () => {
  const { session, requestCookies } = setup(false);
  expect(
    await session.hasFlash<FlashBool>(requestCookies, "flash_bool")
  ).toEqual({
    success: true,
    data: false,
  });
});

test("edgesession.hasFlash() should return true if the session exists", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashBool>(responseCookies, "flash_bool", true);
  expect(
    await session.hasFlash<FlashBool>(requestCookies, "flash_bool")
  ).toEqual({
    success: true,
    data: true,
  });
});

test("edgesession.hasFlash() should return true even if it is a falsy (false)", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashBool>(responseCookies, "flash_bool", false);
  expect(
    await session.hasFlash<FlashBool>(requestCookies, "flash_bool")
  ).toEqual({
    success: true,
    data: true,
  });
});

test("edgesession.hasFlash() should return true if it has been called twice", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashBool>(responseCookies, "flash_bool", true);
  await session.hasFlash<FlashBool>(requestCookies, "flash_bool");
  expect(
    await session.hasFlash<FlashBool>(requestCookies, "flash_bool")
  ).toEqual({
    success: true,
    data: true,
  });
});

test("edgesession.getFlash() should return undefined if it has been read", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashBool>(responseCookies, "flash_bool", true);
  await session.getFlash<FlashBool>(requestCookies, "flash_bool");
  expect(
    await session.getFlash<FlashBool>(requestCookies, "flash_bool")
  ).toEqual({
    success: true,
    data: undefined,
  });
});

test("edgesession.getFlash() should return value even if it is a falsy (false)", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashBool>(responseCookies, "flash_bool", false);
  expect(
    await session.getFlash<FlashBool>(requestCookies, "flash_bool")
  ).toEqual({
    success: true,
    data: false,
  });
});

test("edgesession.getFlash() should return value even if it is a falsy (0)", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashNum>(responseCookies, "flash_num", 0);
  expect(await session.getFlash<FlashNum>(requestCookies, "flash_num")).toEqual(
    {
      success: true,
      data: 0,
    }
  );
});

test("edgesession.getFlash() should return value even if it is a falsy (blank string)", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashStr>(responseCookies, "flash_str", "");
  expect(await session.getFlash<FlashStr>(requestCookies, "flash_str")).toEqual(
    {
      success: true,
      data: "",
    }
  );
});
test("edgesession.getFlash() should return a JSON object if it was committed", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashObj>(responseCookies, "flash_obj", {
    foo: "bar",
  });
  expect(await session.getFlash<FlashObj>(requestCookies, "flash_obj")).toEqual(
    {
      success: true,
      data: { foo: "bar" },
    }
  );
});

test("edgesession.getFlash() should return a JSON array if it was committed", async () => {
  const { session, requestCookies, responseCookies } = setup(false);
  await session.commitFlash<FlashArr>(responseCookies, "flash_arr", [
    { foo: "bar", bar: 1 },
    { foo: "baz", bar: 2 },
  ]);
  expect(await session.getFlash<FlashArr>(requestCookies, "flash_arr")).toEqual(
    {
      success: true,
      data: [
        { foo: "bar", bar: 1 },
        { foo: "baz", bar: 2 },
      ],
    }
  );
});
