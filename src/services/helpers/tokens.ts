import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import crypto from "node:crypto";
import { err, ok, type Result } from "../../result.js";
import type {
  AccessToken,
  AccessTokenPayload,
  AuthConfig,
  AuthError,
  JwtSecret,
  PublicUser,
  RefreshToken,
} from "../../types.js";

export const randomRefresh = () =>
  crypto.randomBytes(16).toString("hex") as RefreshToken;

export function generateAccessToken(
  user: PublicUser,
  config: Pick<AuthConfig, "jwtSecret" | "accessTokenExpiresIn" | "algorithm">,
): AccessToken {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + config.accessTokenExpiresIn,
    },
    config.jwtSecret,
    { algorithm: config.algorithm },
  ) as AccessToken;
}

export function decodeAccessToken(
  accessToken: AccessToken,
  secretToken: JwtSecret,
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
