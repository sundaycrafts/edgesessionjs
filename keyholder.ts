export const algorithm = {
    name: "HMAC",
    hash: "SHA-256",
};

export class Keyholder {
    private cryptoKey: CryptoKey | Promise<CryptoKey>;

    constructor(secret: string) {
        this.cryptoKey = crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(secret),
            algorithm,
            false,
            ["sign", "verify"]
        );
    }

    async get(): Promise<CryptoKey> {
        if (this.cryptoKey instanceof Promise) {
            this.cryptoKey = await this.cryptoKey;
        }
        return this.cryptoKey;
    }
}