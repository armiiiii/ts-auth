import { isErr } from "@src/result.js";
import {
  decodeAccessToken,
  generateAccessToken,
} from "@src/services/helpers/tokens.js";
import type { AccessToken, PublicUser, UserId } from "@src/types.js";

describe("tokens", () => {
  describe("generateAccessToken", () => {
    const user: PublicUser = {
      id: "1234123sadfsasdf" as UserId,
      email: "random-email@mail.com",
    };

    it("payload contains expected userId and email", () => {
      const accessToken = generateAccessToken(user);

      const decoded = decodeAccessToken(accessToken);

      if (decoded.ok) {
        const { sub, email } = decoded.value;
        expect(sub).toBe(user.id);
        expect(email).toBe(user.email);
      } else {
        expect.fail("Payload doesn't contain expected data");
      }
    });

    it("exp is set to ~15 minutes", () => {
      const accessToken = generateAccessToken(user);

      const decoded = decodeAccessToken(accessToken);

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
      const accessToken = generateAccessToken(user, "secret-1");

      const decoded = decodeAccessToken(accessToken, "secret-2");

      if (isErr(decoded)) {
        expect(decoded.error.kind).toBe("TOKEN_INVALID");
      } else {
        expect.fail("Verification should have failed with wrong secret");
      }
    });

    it("verification faild when payload is tampered", () => {
      const tamperedUser = { ...user };

      const accessToken = generateAccessToken(tamperedUser);
      const splittedAccessToken = accessToken.split(".");

      tamperedUser.email = "something_other_than_original@gmail.com";
      let secondAccessToken = generateAccessToken(tamperedUser);
      const secondSplit = secondAccessToken.split(".");
      splittedAccessToken[1] = secondSplit[1] as string;

      const finalToken = splittedAccessToken.join(".") as AccessToken;

      const result = decodeAccessToken(finalToken);

      if (isErr(result)) {
        expect(result.error.kind).toBe("TOKEN_INVALID");
      } else {
        expect.fail("Tampered token should have failed verification");
      }
    });

    it("verification faild when token is expired", () => {
      vi.useFakeTimers();

      const accessToken = generateAccessToken(user);

      vi.advanceTimersByTime(16 * 60 * 1000);

      const result = decodeAccessToken(accessToken);

      if (isErr(result)) {
        expect(result.error.kind).toBe("TOKEN_EXPIRED");
      } else {
        expect.fail("Token should have been expired");
      }

      vi.useRealTimers();
    });
  });
});
