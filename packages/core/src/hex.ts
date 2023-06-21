import {Result} from "./util/result.ts";

export class Hex {
    private constructor(private readonly buf: Uint8Array) {
    }

    toString(): string {
        return Array.from(this.buf)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    }

    toU8Array(): Uint8Array {
        return this.buf;
    }

    static tryFromString(hex: string): Result<Hex, Error> {
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