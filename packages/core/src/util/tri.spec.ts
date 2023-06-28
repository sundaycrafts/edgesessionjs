import { expect, test } from "bun:test";
import {tri} from "./tri.ts";
import {Err, Ok, Result} from "./result.ts";

test("tri function success case", async () => {
    const successFn = (a: number, b: number) => a + b;
    const triFn = tri<Error, number, [number, number]>(successFn);

    const result: Result<number, Error> = await triFn(2, 3);

    const expected: Ok<number> = {
        success: true,
        data: 5,
    }

    expect(result).toEqual(expected);
});

test("tri function error case", async () => {
    const errorFn = () => { throw new Error("Test Error") };
    const triFn = tri<Error, void, void[]>(errorFn);

    const result: Result<void, Error> = await triFn();

    const expected: Err<Error> = {
        success: false,
        error: new Error("Test Error")
    }

    expect(result).toEqual(expected);
});
