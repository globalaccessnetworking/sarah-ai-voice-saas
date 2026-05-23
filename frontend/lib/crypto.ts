import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

/**
 * Global Access AI Crypto Utility
 * Standardized AES-256-GCM encryption for database-stored credentials.
 */

function getKey(): Buffer {
    const secret = process.env.APP_SECRET_KEY;
    if (!secret) {
        throw new Error("APP_SECRET_KEY is not defined in environment variables.");
    }
    // Use PBKDF2 to derive a 32-byte key from the secret
    return crypto.pbkdf2Sync(secret, "global_access_salt", ITERATIONS, KEY_LENGTH, "sha512");
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(hash: string): string {
    const parts = hash.split(":");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted format.");
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
