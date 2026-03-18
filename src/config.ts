import type { JwtSecret } from "./types.js";

export function createSecret(secret: string): JwtSecret {
  if (secret.length < 32)
    throw new Error("Secret must be at least 32 characters");
  return secret as JwtSecret;
}
