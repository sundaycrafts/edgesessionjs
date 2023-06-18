import {Nil} from "./util/nil.ts";

interface Cookies {
    get(name: string): Nil | { value: string | Nil };
}

export interface RequestCookies extends Cookies {
}

export interface ResponseCookies extends Cookies {
    set(options: {
        name: string;
        value: string;
        expires?: Date | number;
        maxAge?: number;
        sameSite?: "strict";
        httpOnly?: boolean;
        path?: string;
        secure: true;
    }): void;
    delete(name: string): void;
}
