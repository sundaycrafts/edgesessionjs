import {algorithm, Keyholder} from "./keyholder.ts";
import {Result} from "./util/result.ts";
import {Hex} from "./hex.ts";

export class Signature {
    private readonly key: Keyholder;

    constructor(secret: string) {
        this.key = new Keyholder(secret);
    }

    async sign(message: string): Promise<string> {
        const buf = await crypto.subtle.sign(
            algorithm,
            await this.key.get(),
            await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message))
        );

        return message + "." + Hex.fromArrayBuffer(buf).toString();
    }

    async unsign(signed: string): Promise<Result<string, Error>> {
        const pair = signed.split(".");

        if (pair.length !== 2) {
            return {
                success: false,
                error: new Error("Invalid signature"),
            };
        }

        const [msg, sig] = pair;

        const hex = Hex.tryFromString(sig);
        if (!hex.success) return hex;

        const valid = await crypto.subtle.verify(
            algorithm,
            await this.key.get(),
            hex.data.toU8Array(),
            await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg))
        );

        if (valid) {
            return {
                success: true,
                data: msg,
            };
        } else {
            return {
                success: false,
                error: new Error("Invalid signature"),
            };
        }
    }
}
