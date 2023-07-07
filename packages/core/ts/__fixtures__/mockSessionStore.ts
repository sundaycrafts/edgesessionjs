import { SessionStore } from "../sessionStore";
import { StateValue } from "../stateValue";
import { Result } from "../util";
import { Spy } from "./spy";

export class MockSessionStore implements SessionStore {
  private store: Record<string, StateValue> = {};
  public spy = {
    del: new Spy(),
    dellAll: new Spy(),
    get: new Spy(),
    set: new Spy(),
  };

  constructor(private readonly fail: boolean) {}

  private failOr<V>(value: V): Result<V, Error> {
    if (this.fail) {
      return { success: false, error: new Error("mock error") };
    } else {
      return { success: true, data: value };
    }
  }

  del(key: string): Result<void, Error> | Promise<Result<void, Error>> {
    this.spy.del.call(key);
    delete this.store[key];
    return this.failOr(undefined);
  }

  delAll(prefix: string): Result<void, Error> | Promise<Result<void, Error>> {
    this.spy.dellAll.call(prefix);
    Object.keys(this.store).map((key) => {
      if (key.startsWith(prefix)) delete this.store[key];
    });
    return this.failOr(undefined);
  }

  get(
    key: string
  ):
    | Result<StateValue | undefined, Error>
    | Promise<Result<StateValue | undefined, Error>> {
    this.spy.get.call(key);
    return this.failOr(this.store[key]);
  }

  set(
    key: string,
    value: StateValue
  ): Result<void, Error> | Promise<Result<void, Error>> {
    this.spy.set.call(key, value);
    this.store[key] = value;
    return this.failOr(undefined);
  }
}
