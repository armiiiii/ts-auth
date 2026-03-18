import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import crypto from "node:crypto";
import { err, ok, type Result } from "../../result.js";
import type {
  AccessToken,
  AccessTokenPayload,
  AuthError,
  PublicUser,
  RefreshToken,
} from "../../types.js";
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  DEV_SECRET,
  SIGN_ALGORITHM,
} from "./consts.js";

export const randomRefresh = () =>
  crypto.randomBytes(16).toString("hex") as RefreshToken;

export function generateAccessToken(
  user: PublicUser,
  secretToken = DEV_SECRET,
): AccessToken {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRATION_TIME,
    },
    secretToken,
    { algorithm: SIGN_ALGORITHM },
  ) as AccessToken;
}

export function decodeAccessToken(
  accessToken: AccessToken,
  secretToken = DEV_SECRET,
): Result<AccessTokenPayload, AuthError> {
  try {
    const decoded = jwt.verify(accessToken, secretToken) as AccessTokenPayload;
    return ok(decoded);
  } catch (e) {
    if (e instanceof TokenExpiredError) return err({ kind: "TOKEN_EXPIRED" });
    if (e instanceof JsonWebTokenError) return err({ kind: "TOKEN_INVALID" });
    return err({ kind: "TOKEN_INVALID" });
  }
}
