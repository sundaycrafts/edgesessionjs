import {Result} from "./result.ts";

export function tri<E, Out, In extends any[] = never[]>(fn: (...i: In) => Out | Promise<Out>): (...i: In) => Promise<Result<Out, E>> {
    return async (...i: In) => {
        try {
            const data = await fn(...i);
            return {success: true, data: data};
        } catch (e) {
            return {success: false, error: e as E};
        }
    }
}