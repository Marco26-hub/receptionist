import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || (process.env.NODE_ENV !== "production" ? process.env.SESSION_SECRET : undefined);
  if (!secret || secret.length < 32) throw new Error("INTEGRATION_ENCRYPTION_KEY deve avere almeno 32 caratteri");
  return createHash("sha256").update(secret).digest();
}

export function integrationEncryptionReady() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || (process.env.NODE_ENV !== "production" ? process.env.SESSION_SECRET : undefined);
  return Boolean(secret && secret.length >= 32);
}

export function encryptIntegrationConfig(value: Record<string, unknown>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptIntegrationConfig<T extends Record<string, unknown>>(token: string): T {
  const [version, iv, tag, encrypted] = token.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) throw new Error("Configurazione cifrata non valida");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  const clear = Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
  return JSON.parse(clear) as T;
}
