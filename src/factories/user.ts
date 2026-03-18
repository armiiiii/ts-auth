import type { PasswordHash, User, UserId } from "@src/types.js";
import crypto from "node:crypto";

export function createUser(email: string, hash: PasswordHash): User {
  const now = Date.now();

  return {
    id: crypto.randomBytes(8).toString("hex") as UserId,
    email: email,
    passwordHash: hash,
    createdAt: now,
    updatedAt: now,
  };
}
