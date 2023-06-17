import {DateTime} from "luxon";
import {Signature} from "./signature";
import {SessionStore} from "./sessionStore";
import {RequestCookies, ResponseCookies} from "./cookies";
import {Serializable} from "./util/serializable";
import {Result} from "./util/result";
import {Nil} from "./util/nil";
import {lift} from "./util/lift";

/** `data:${session_id}:${label}` */
type DataID = `data:${string}:${string}`;

/** `flash:${session_id}:${label}` */
type FlashID = `flash:${string}:${string}`;

export type SessionState<
    K extends string,
    V extends Serializable,
    F extends boolean = false
> = {
    key: K;
    value: V;
    flash: F;
};

/**
 * If a cookie name has `__Host-` prefix,
 * it's accepted in a Set-Cookie header only if it's also marked with the Secure attribute,
 * was sent from a secure origin, does not include a Domain attribute, and has the Path attribute set to /.
 * This way, these cookies can be seen as "domain-locked".
 *
 * The browser will reject cookies with these prefixes that don't comply with their restrictions.
 * Note that this ensures that subdomain-created cookies with prefixes are either confined to the subdomain
 * or ignored completely. As the application server only checks for a specific cookie name when determining
 * if the user is authenticated or a CSRF token is correct, this effectively acts
 * as a defense measure against session fixation.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies */
const SESSION_KEY = "__Host-session" as const;

export class Session<ReqC extends RequestCookies, ResC extends ResponseCookies> {
    constructor(
        private readonly signature: Signature,
        private readonly store: SessionStore
    ) {
    }

    private index<K extends "data" | "flash">(
        sessionId: string,
        kind: K,
        label: string
    ): K extends "data" ? DataID : FlashID {
        return `${kind}:${sessionId}:${label}` as K extends "data"
            ? DataID
            : FlashID;
    }

    private async sessionIdFromCookies(
        cookies: ReqC | ResC
    ): Promise<string | undefined> {
        const res = await this.signature.unsign(
            cookies.get(SESSION_KEY)?.value || ""
        );

        if (!res.success) return undefined;

        return res.data || undefined;
    }

    private async putSessionIdToCookies(
        cookies: ResC,
        expiresIn: DateTime
    ): Promise<string> {
        const sessionId =
            (await this.sessionIdFromCookies(cookies)) || crypto.randomUUID();

        cookies.set({
            name: SESSION_KEY,
            value: await this.signature.sign(sessionId),
            expires: expiresIn.toJSDate(),
            maxAge: expiresIn.diffNow("seconds").seconds,
            sameSite: "strict",
            httpOnly: true,
            path: "/",
            secure: true,
        });

        return sessionId;
    }

    async get<S extends SessionState<any, any, false>, E>(
        cookies: ReqC | ResC,
        label: S["key"]
    ): Promise<Result<string | Nil, E>> {
        const id = await this.sessionIdFromCookies(cookies);
        if (!id) return {success: true, data: undefined};
        return lift<E, string | Nil>(() => this.store.get(this.index(id, "data", label)))()
    }

    async commit<S extends SessionState<any, any, false>>(
        cookies: ResC,
        label: S["key"],
        value: S["value"] | undefined,
        expiresIn: DateTime = DateTime.now().plus({months: 1})
    ): Promise<Result<void, Error>> {
        const sessionId = await this.putSessionIdToCookies(cookies, expiresIn);
        const key = this.index(sessionId, "data", label);

        if (value === undefined || value === null) {
            return lift<Error, void>(() => this.store.del(key))()
        } else {
            return lift<Error, void>(() => this.store.set(key, value.toString()))()
        }
    }

    async destroy(
        cookies: ResC
    ): Promise<Result<void, Error>> {
        const sessionId = await this.sessionIdFromCookies(cookies);
        if (!sessionId) return {success: true, data: undefined}

        const res = await lift<Error, void>(() => this.store.delAll(sessionId))()
        if (!res.success) return {success: false, error: res.error}

        cookies.delete(SESSION_KEY);
        return res
    }

    async hasFlash<S extends SessionState<any, any, true>>(
        cookies: ReqC | ResC,
        label: S["key"]
    ): Promise<Result<boolean, Error>> {
        const sessionId = await this.sessionIdFromCookies(cookies);
        if (!sessionId) return {success: true, data: false};

        const index = this.index(sessionId, "flash", label);
        return await lift<Error, boolean>(async () => typeof await this.store.get(index) === "string")()
    }

    async getFlash<S extends SessionState<any, any, true>>(
        cookies: ReqC | ResC,
        label: S["key"]
    ): Promise<Result<unknown, Error>> {
        const sessionId = await this.sessionIdFromCookies(cookies);
        if (!sessionId) return {success: true, data: undefined};

        const index = this.index(sessionId, "flash", label);
        const res = await lift<Error, unknown>(() => this.store.del(index))();
        if (!res.success) return {success: false, error: res.error}

        const res2 = await lift<Error, void>(() => this.store.del(index))();
        if (!res2.success) return {success: false, error: res2.error}

        return res;
    }

    async commitFlash<S extends SessionState<any, any, true>>(
        cookies: ResC,
        label: S["key"],
        value: S["value"] | undefined,
        lifetime: number = 120
    ): Promise<Result<void, Error>> {
        if (value === undefined || value === null) return {success: true, data: undefined};
        const sessionId = await this.putSessionIdToCookies(
            cookies,
            DateTime.now().plus({seconds: lifetime})
        );
        const index = this.index(sessionId, "flash", label);

        return lift<Error, void>(() => this.store.set(index, value.toString()))()
    }
}
