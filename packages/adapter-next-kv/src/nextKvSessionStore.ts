import type {SessionStore} from "edgesession";
import type {Nil, Result} from "edgesession/util";
import {lift} from "edgesession/util";
import {VercelKV} from "@vercel/kv";

export class NextKvSessionStore implements SessionStore {
    constructor(private readonly client: VercelKV) {
    }

    async del(key: string): Promise<Result<void, Error>> {
        return lift<Error, void>(async () => {
            await this.client.del(key);
        })()
    }

    async delAll(prefix: string): Promise<Result<void, Error>> {
        return lift<Error, void>(async () => {
            await Promise.all(
                (await this.client.keys(`${prefix}*`)).map((key) => this.client.del(key))
            );
        })();
    }

    async get(key: string): Promise<Result<string | Nil, Error>> {
        const res = await lift<Error, string | null>(() => this.client.get(key))();
        if (!res.success) return res;
        return {...res, data: res.data ? JSON.stringify(res.data) : null};
    }

    async set(key: string, value: string): Promise<Result<void, Error>> {
        return await lift<Error, void>(async () => {
            await this.client.set(key, value);
        })();
    }
}
