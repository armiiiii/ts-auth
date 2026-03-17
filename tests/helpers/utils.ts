import crypto from "node:crypto";
import type {
  RefreshToken,
  StoredRefreshToken,
  StoredRefreshTokenId,
  UserId,
} from "@src/types.js";

export const DEV_EXPIRES_AT = 30 * 24 * 60 * 60;

export const randomRefresh = () =>
  crypto.randomBytes(16).toString("hex") as RefreshToken;

export const randomStoredTokenId = () =>
  crypto.randomBytes(8).toString("hex") as StoredRefreshTokenId;

export const randomUserId = () =>
  crypto.randomBytes(8).toString("hex") as UserId;

export function generateStoredRefreshToken(): StoredRefreshToken {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: randomStoredTokenId(),
    userId: randomUserId(),
    token: randomRefresh(),
    createdAt: now,
    expiresAt: now + DEV_EXPIRES_AT,
  };
}

export function generateStoredRefreshTokens(n: number): StoredRefreshToken[] {
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(generateStoredRefreshToken());
  }
  return result;
}

export function generateStoredRefreshTokensForUserId(
  n: number,
  userId: UserId,
): StoredRefreshToken[] {
  const result = generateStoredRefreshTokens(n);

  for (const entry of result) {
    entry.userId = userId;
  }

  return result;
}
