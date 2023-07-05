import { Serializable } from "./util/serializable";

export type SessionState<
  K extends string,
  V extends Serializable,
  F extends boolean = false
> = {
  key: K;
  value: V;
  flash: F;
};
