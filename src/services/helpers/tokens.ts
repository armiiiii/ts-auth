import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { err, ok, type Result } from "../../result.js";
import type {
    AccessToken,
    AccessTokenPayload,
    AuthError,
    PublicUser,
} from "../../types.js";

const DEV_SECRET =
  "2cb0d9f89c9b878a34a85b678b1bba354fa6a9daae84f8fa3fac293c1033c419";

const ACCESS_TOKEN_EXPIRATION_TIME = 15 * 60; // 15 minutes

const SIGN_ALGORITHM = "HS256";

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
