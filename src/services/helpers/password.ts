import bcrypt from "bcrypt";
import type { PasswordHash } from "../../types.js";

export async function hashPassword(plain: string): Promise<PasswordHash> {
  const hash = await bcrypt.hash(plain, 10);
  return hash as PasswordHash;
}

export async function verifyPassword(
  plain: string,
  hash: PasswordHash,
): Promise<boolean> {
  const valid = await bcrypt.compare(plain, hash);
  return valid
}
