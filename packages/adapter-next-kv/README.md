# @edgesession/adapter-next-kv

A session manager for Next.js on edge runtime.

## Getting started

**Prerequisite**

Please make sure that [Vercel KV](https://vercel.com/docs/storage/vercel-kv) is enabled.

```sh
npm i edgesession @edgesession/adapter-next-kv @vercel/kv
```

```ts
// kvsession.ts
import { kv } from "@vercel/kv";
import { Signature, EdgeSession } from "edgesession";
import { NextKvSessionStore } from "@edgesession/adapter-next-kv";

export const kvsession = new EdgeSession(
  new Signature(process.env.SESSION_SECRET as string),
  new NextKvSessionStore(kv)
);
```

```tsx
// page.tsx
import { cookies } from "next/headers";
import { kvsession } from "./kvsession";
import { SessionState } from "edgesession";

interface UserId extends SessionState<"user_id"> {}
interface SubmissionResult extends SessionState<"submission_result", "success" | "failed", true> {}

export async function getSessionData() {
    const res = await kvsession.get<UserId>(cookies(), "user_id");
    if (!res.success) return res;
    
    console.log(`user_id => ${res.data}`) // => user_id => xxx-yyy-zzz

    // Flash data will be volatile once it's fetched.
    const res2 = await kvsession.getFlash<SubmissionResult>(cookies(), "submission_result");
    if (!res2.success) return res;

    console.log(`submission_result => ${res2.data}`) // => submission_result => success
    
    return { success: true, userId: res.data, submtResult: res2.data }
}

export default async function Page() {
    const res = await getSessionData()
    
    if (!res.success) {
        return (<h1>Error</h1>)
    } else {
        // ...
    }
}
```
