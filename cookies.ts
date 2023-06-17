import {Nil} from "./util/nil";

interface Cookies {
    get(name: string): Nil | { value: string | Nil };
}

export interface RequestCookies extends Cookies {
}

export interface ResponseCookies extends Cookies {
    set(p: any): void;
    delete(name: string): void;
}
