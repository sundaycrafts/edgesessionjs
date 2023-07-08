# edgesession

A session manager for edge runtime.

# Features
- ✅ Strong type safe
- ✅ Support flash (one-time) session
- ✅ Built on the native Web API
- ✅ Minimal implementation
- ✅ Low overhead
- ✅ Framework-agnostic
- ✅ Zero dependency
- ✅ Edge runtime ready
- ✅ Built with [Bun](https://bun.sh/)

## Supported framework/storage

- Next.js (App router) / Vercel KV
  - [@edgesession/adapter-next-kv](https://www.npmjs.com/package/@edgesession/adapter-next-kv).
- Sveltekit / Cloudflare KV
  - Work in progress
- Remix
  - Planning. Or you can use [Official session manager](https://remix.run/docs/en/main/utils/sessions) without type safe future.
- Other framework
  - You can write your own adapter by implementing `SessionStore` interface in few minutes (see source code).

## Basic usage

This library is always used in combination with an adapter.
Please refer to each adapter for specific usage.

```ts
// session.ts
export const session = new EdgeSession(
  new Signature(process.env.SESSION_SECRET as string),
  new ADAPTER_SESSIONSTORE_HERE()
);
```

```ts
// session-state.ts
import { SessionState } from "edgesession";

// Persistent session state
export interface UserId extends SessionState<"user_id"> {}

// Flash (one-time) session state
export interface SubmissionResult extends SessionState<"submission_result", "success" | "failed", true> {}
```

```ts
// your-entrypoint.ts
import { session } from "./session";
import { UserId, SubmissionResult } from "./session-state";

export async function getSessionData() {
    const res = await session.get<UserId>(cookies(), "user_id");
    if (!res.success) return res;

    console.log(`user_id => ${res.data}`) // => user_id => xxx-yyy-zzz

    // Flash data will be volatile once it's fetched.
    const res2 = await session.getFlash<SubmissionResult>(cookies(), "submission_result");
    if (!res2.success) return res;

    console.log(`submission_result => ${res2.data}`) // => submission_result => success

    return { success: true, userId: res.data, submtResult: res2.data }
}
```