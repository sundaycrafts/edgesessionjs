import { StateValue } from "./stateValue";

export type SessionState<
  K extends string,
  V extends StateValue,
  F extends boolean = false
> = {
  key: K;
  value: V;
  flash: F;
};
