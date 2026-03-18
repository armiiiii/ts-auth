import { isErr } from "@src/result.js";
import {
  decodeAccessToken,
  generateAccessToken,
} from "@src/services/helpers/tokens.js";
import type {
  AccessToken,
  AuthConfig,
  JwtSecret,
  PublicUser,
  UserId,
} from "@src/types.js";

const TEST_CONFIG: AuthConfig = {
  jwtSecret: "test-secret-1" as JwtSecret,
  algorithm: "HS256",
  accessTokenExpiresIn: 15 * 60,
  refreshTokenExpiresIn: 30 * 24 * 60 * 60,
};

describe("tokens", () => {
  describe("generateAccessToken", () => {
    const user: PublicUser = {
      id: "1234123sadfsasdf" as UserId,
      email: "random-email@mail.com",
    };

    it("payload contains expected userId and email", () => {
      const accessToken = generateAccessToken(user, TEST_CONFIG);

      const decoded = decodeAccessToken(accessToken, TEST_CONFIG.jwtSecret);

      if (decoded.ok) {
        const { sub, email } = decoded.value;
        expect(sub).toBe(user.id);
        expect(email).toBe(user.email);
      } else {
        expect.fail("Payload doesn't contain expected data");
      }
    });

    it("exp is set to ~15 minutes", () => {
      const accessToken = generateAccessToken(user, TEST_CONFIG);

      const decoded = decodeAccessToken(accessToken, TEST_CONFIG.jwtSecret);

      const now = Math.floor(Date.now() / 1000);
      if (decoded.ok) {
        const { exp } = decoded.value;
        expect(exp).toBeGreaterThan(now + 14 * 60);
        expect(exp).toBeLessThan(now + 16 * 60);
      } else {
        expect.fail("exp is not around 15 minutes");
      }
    });

    it("verification fails with wrong secret", () => {
      const accessToken = generateAccessToken(user, TEST_CONFIG);

      const decoded = decodeAccessToken(
        accessToken,
        "test-secret-123123123" as JwtSecret,
      );

      if (isErr(decoded)) {
        expect(decoded.error.kind).toBe("TOKEN_INVALID");
      } else {
        expect.fail("Verification should have failed with wrong secret");
      }
    });

    it("verification faild when payload is tampered", () => {
      const tamperedUser = { ...user };

      const accessToken = generateAccessToken(user, TEST_CONFIG);
      const splittedAccessToken = accessToken.split(".");

      tamperedUser.email = "something_other_than_original@gmail.com";
      let secondAccessToken = generateAccessToken(tamperedUser, TEST_CONFIG);
      const secondSplit = secondAccessToken.split(".");
      splittedAccessToken[1] = secondSplit[1] as string;

      const finalToken = splittedAccessToken.join(".") as AccessToken;

      const result = decodeAccessToken(finalToken, TEST_CONFIG.jwtSecret);

      if (isErr(result)) {
        expect(result.error.kind).toBe("TOKEN_INVALID");
      } else {
        expect.fail("Tampered token should have failed verification");
      }
    });

    it("verification faild when token is expired", () => {
      vi.useFakeTimers();

      const accessToken = generateAccessToken(user, TEST_CONFIG);

      vi.advanceTimersByTime(16 * 60 * 1000);

      const result = decodeAccessToken(accessToken, TEST_CONFIG.jwtSecret);

      if (isErr(result)) {
        expect(result.error.kind).toBe("TOKEN_EXPIRED");
      } else {
        expect.fail("Token should have been expired");
      }

      vi.useRealTimers();
    });
  });
});
