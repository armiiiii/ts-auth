import type {
    AuthConfig,
    RefreshToken,
    StoredRefreshToken,
    StoredRefreshTokenId,
    UserId,
} from "@src/types.js";
import crypto from "node:crypto";

export function generateStoredRefresh(
  token: RefreshToken,
  userId: UserId,
  config: Pick<AuthConfig, "refreshTokenExpiresIn">,
): StoredRefreshToken {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: crypto.randomBytes(8).toString("hex") as StoredRefreshTokenId,
    userId,
    token: token,
    expiresAt: now + config.refreshTokenExpiresIn,
    createdAt: now,
  };
}
