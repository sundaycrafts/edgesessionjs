import { JsonArray } from "./jsonArray";
import { JsonObject } from "./jsonObject";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonArray
  | JsonObject;