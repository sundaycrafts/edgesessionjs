import type { SessionStore } from "edgesession";
import type { Result } from "edgesession/util";
import type { VercelKV } from "@vercel/kv";
import { deserialize, isNil, tri } from "edgesession/util";
import { StateValue } from "edgesession/stateValue";

export class NextKvSessionStore implements SessionStore {
  constructor(private readonly client: VercelKV) {}

  async del(key: string): Promise<Result<void, Error>> {
    return tri<Error, void>(async () => {
      await this.client.del(key);
    })();
  }

  async delAll(prefix: string): Promise<Result<void, Error>> {
    return tri<Error, void>(async () => {
      await Promise.all(
        (
          await this.client.keys(`${prefix}*`)
        ).map((key) => this.client.del(key))
      );
    })();
  }

  async get(key: string): Promise<Result<StateValue | undefined, Error>> {
    const res = await tri<Error, string | null>(() => this.client.get(key))();
    if (!res.success) return res;
    if (isNil(res.data)) return { success: true, data: undefined };

    return deserialize(res.data);
  }

  async set(key: string, value: StateValue): Promise<Result<void, Error>> {
    return await tri<Error, void>(async () => {
      await this.client.set(key, value);
    })();
  }
}
