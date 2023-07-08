import { JsonObject } from "./jsonObject";
import { JsonArray } from "./jsonArray";
import { ParsablePrimitives } from "./parsablePrimitives";
import { Result } from "./result";

export function deserialize(
  value: string
): string | ParsablePrimitives | JsonObject | JsonArray {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
