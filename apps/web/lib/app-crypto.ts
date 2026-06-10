import "server-only";
import { createCrypto } from "@dev-telemetry/crypto";

const key = process.env.SECRET_ENCRYPTION_KEY;
if (!key) {
  throw new Error("SECRET_ENCRYPTION_KEY is not set");
}

/** Application-wide AES-256-GCM crypto singleton. Server-only. */
export const appCrypto = createCrypto(key);
