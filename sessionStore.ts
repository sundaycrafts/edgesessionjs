export type SessionStore = {
    set: (key: string, value: string) => void | Promise<void>;
    get: (
        key: string
    ) => string | undefined | null | Promise<string | undefined | null>;
    del: (key: string) => void | Promise<void>;
    delAll: (prefix: string) => void | Promise<void>;
};