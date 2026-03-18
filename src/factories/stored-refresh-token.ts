import { DEV_EXPIRES_AT } from "@src/services/helpers/consts.js";
import type {
    RefreshToken,
    StoredRefreshToken,
    StoredRefreshTokenId,
    UserId,
} from "@src/types.js";
import crypto from "node:crypto";

export function generateStoredRefresh(
  token: RefreshToken,
  userId: UserId,
): StoredRefreshToken {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: crypto.randomBytes(8).toString("hex") as StoredRefreshTokenId,
    userId,
    token: token,
    expiresAt: now + DEV_EXPIRES_AT,
    createdAt: now,
  };
}
