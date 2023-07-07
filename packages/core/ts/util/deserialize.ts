import { JsonObject } from "./jsonObject";
import { JsonArray } from "./jsonArray";
import { ParsablePrimitives } from "./parsablePrimitives";
import { Result } from "./result";

export function deserialize(
  value: string
): Result<ParsablePrimitives | JsonObject | JsonArray, Error> {
  try {
    return { success: true, data: JSON.parse(value) };
  } catch (e) {
    return { success: false, error: e as Error };
  }
}
