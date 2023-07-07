import { Result } from "./util";
import { StateValue } from "./stateValue";

export type SessionStore<E = Error> = {
  set: (
    key: string,
    value: StateValue
  ) => Result<void, E> | Promise<Result<void, E>>;
  get: (
    key: string
  ) =>
    | Result<StateValue | undefined, E>
    | Promise<Result<StateValue | undefined, E>>;
  del: (key: string) => Result<void, E> | Promise<Result<void, E>>;
  delAll: (prefix: string) => Result<void, E> | Promise<Result<void, E>>;
};
