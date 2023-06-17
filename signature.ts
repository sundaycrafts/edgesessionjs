import {algorithm, Keyholder} from "./keyholder";
import {Result} from "./result";

class Hex {
    private constructor(private readonly buf: Uint8Array) {}

    toString(): string {
        return Array.from(this.buf)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    toU8Array(): Uint8Array {
        return this.buf;
    }

    static tryFromString(hex: string): Result<Hex> {
        if (hex.length % 2 !== 0) {
            return {
                success: false,
                error: new Error("The input hex string is of an invalid length."),
            };
        }

        const bytes = new Uint8Array(hex.length / 2);

        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
        }

        return {
            success: true,
            data: Hex.fromArrayBuffer(bytes.buffer as ArrayBuffer),
        };
    }

    /** see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string */
    static fromArrayBuffer(buf: ArrayBuffer): Hex {
        return new Hex(new Uint8Array(buf));
    }
}

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

    async unsign(signed: string): Promise<Result<string>> {
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
