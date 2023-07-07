import { Nil } from "./nil";

export function isNil(value: unknown): value is Nil {
  return value === null || value === undefined;
}
