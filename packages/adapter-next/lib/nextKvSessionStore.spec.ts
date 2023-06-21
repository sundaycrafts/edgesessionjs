import { test } from "bun:test";
import {NextKvSessionStore} from "./nextKvSessionStore.ts";

test("nextKvSessionStore should be passed type check", async () => {
    new NextKvSessionStore(null as any)
});
