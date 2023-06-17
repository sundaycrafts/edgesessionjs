import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";
import {
    RequestCookies,
    ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies";
import { DateTime } from "luxon";
import { SafeParseReturnType, ZodError } from "zod";
import { Signature } from "./signature";

/** `${session_id}:data:${label}` */
type DataID = `${string}:data:${string}`;

/** `${session_id}:flash:${label}` */
type FlashID = `${string}:flash:${string}`;

export type SessionState<
    K extends string,
    V extends string | number | boolean,
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

export type SessionStore = {
    set: (key: string, value: string) => void | Promise<void>;
    get: (
        key: string
    ) => string | undefined | null | Promise<string | undefined | null>;
    del: (key: string) => void | Promise<void>;
    delAll: (prefix: string) => void | Promise<void>;
};

export class Session {
    constructor(
        private readonly signature: Signature,
        private readonly store: SessionStore
    ) {}

    private index<K extends "data" | "flash">(
        sessionId: string,
        kind: K,
        label: string
    ): K extends "data" ? DataID : FlashID {
        return `${sessionId}:${kind}:${label}` as K extends "data"
            ? DataID
            : FlashID;
    }

    private async sessionIdFromCookies(
        cookies: ResponseCookies | RequestCookies | ReadonlyRequestCookies
    ): Promise<string | undefined> {
        const res = await this.signature.unsign(
            cookies.get(SESSION_KEY)?.value || ""
        );

        if (!res.success) return undefined;

        return res.data || undefined;
    }

    private async putSessionIdToCookies(
        cookies: ResponseCookies,
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

    async get<S extends SessionState<any, any, false>>(
        cookies: ResponseCookies | RequestCookies | ReadonlyRequestCookies,
        label: S["key"]
    ): Promise<SafeParseReturnType<unknown, string | undefined>> {
        const id = await this.sessionIdFromCookies(cookies);
        if (!id) return { success: true, data: undefined };

        try {
            return {
                success: true,
                data:
                    (await this.store.get(this.index(id, "data", label))) || undefined,
            };
        } catch {
            return { success: false, error: new ZodError([]) };
        }
    }

    async commit<S extends SessionState<any, any, false>>(
        cookies: ResponseCookies,
        label: S["key"],
        value: S["value"] | undefined,
        expiresIn: DateTime = DateTime.now().plus({ months: 1 })
    ): Promise<Error | undefined> {
        const sessionId = await this.putSessionIdToCookies(cookies, expiresIn);
        const key = this.index(sessionId, "data", label);
        try {
            if (value === undefined || value === null) {
                await this.store.del(key);
            } else {
                await this.store.set(key, value.toString());
            }
        } catch (e) {
            return new Error(e as string);
        }
    }

    async destroy(
        cookies: ResponseCookies | RequestCookies | ReadonlyRequestCookies
    ): Promise<Error | undefined> {
        const sessionId = await this.sessionIdFromCookies(cookies);
        if (!sessionId) return;

        try {
            await this.store.delAll(sessionId);
            cookies.delete(SESSION_KEY);
        } catch (e) {
            return new Error(e as string);
        }
    }

    async hasFlash<S extends SessionState<any, any, true>>(
        cookies: ResponseCookies | RequestCookies | ReadonlyRequestCookies,
        label: S["key"]
    ): Promise<SafeParseReturnType<unknown, boolean>> {
        const sessionId = await this.sessionIdFromCookies(cookies);
        if (!sessionId) return { success: true, data: false };

        const index = this.index(sessionId, "flash", label);
        try {
            const v = await this.store.get(index);
            return { success: true, data: v !== undefined && v !== null };
        } catch {
            return { success: false, error: new ZodError([]) };
        }
    }

    async getFlash<S extends SessionState<any, any, true>>(
        cookies: ResponseCookies | RequestCookies | ReadonlyRequestCookies,
        label: S["key"]
    ): Promise<SafeParseReturnType<unknown, string | undefined>> {
        const sessionId = await this.sessionIdFromCookies(cookies);
        if (!sessionId) return { success: true, data: undefined };

        const index = this.index(sessionId, "flash", label);
        try {
            const v = await this.store.get(index);
            await this.store.del(index);
            return { success: true, data: v || undefined };
        } catch {
            return { success: false, error: new ZodError([]) };
        }
    }

    async commitFlash<S extends SessionState<any, any, true>>(
        cookies: ResponseCookies,
        label: S["key"],
        value: S["value"] | undefined,
        lifetime: number = 120
    ): Promise<void | Error> {
        if (value === undefined || value === null) return;
        const sessionId = await this.putSessionIdToCookies(
            cookies,
            DateTime.now().plus({ seconds: lifetime })
        );

        const index = this.index(sessionId, "flash", label);
        try {
            await this.store.set(index, value.toString());
        } catch (e) {
            return new Error(e as string);
        }
    }
}
