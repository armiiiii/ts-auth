import bcrypt from "bcrypt";
import type { PasswordHash, PlainPassword } from "../../types.js";

export async function hashPassword(
  plain: PlainPassword,
): Promise<PasswordHash> {
  if (plain.trim() === "") {
    throw new TypeError("Invalid password structure");
  }
  const hash = await bcrypt.hash(plain, 10);
  return hash as PasswordHash;
}

export async function verifyPassword(
  plain: PlainPassword,
  hash: PasswordHash,
): Promise<boolean> {
  const valid = await bcrypt.compare(plain, hash);
  return valid;
}
