import {Result} from "./util/result.ts";
import {Nil} from "./util/nil.ts";

export type SessionStore<E = Error> = {
    set: (key: string, value: string) => Result<void, E> | Promise<Result<void, E>>;
    get: (
        key: string
    ) => Result<string | Nil, E> | Promise<Result<string | Nil, E>>
    del: (key: string) => Result<void, E> | Promise<Result<void, E>>;
    delAll: (prefix: string) => Result<void, E> | Promise<Result<void, E>>;
};