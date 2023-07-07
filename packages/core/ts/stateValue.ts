import { ParsablePrimitives } from "./util/parsablePrimitives";
import { JsonObject } from "./util/jsonObject";
import { JsonArray } from "./util/jsonArray";

export type StateValue = string | ParsablePrimitives | JsonObject | JsonArray;
