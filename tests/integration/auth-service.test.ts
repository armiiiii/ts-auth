import {
    AuthService,
    createSecret,
    TokenRepository,
    UserRepository,
    type AuthConfig,
    type PlainPassword,
    type RefreshResult,
    type RefreshToken,
} from "@src/index.js";
import crypto from "node:crypto";

const config: AuthConfig = {
  algorithm: "HS256",
  accessTokenExpiresIn: 15 * 60, // Seconds
  refreshTokenExpiresIn: 30 * 24 * 60 * 60, // Seconds
  jwtSecret: createSecret(crypto.randomBytes(32).toString("hex")),
};

describe("Integration tests", () => {
  const tokenRepo = new TokenRepository();
  const userRepo = new UserRepository();
  const authService = new AuthService(userRepo, tokenRepo, config);
  const email = "some-email@mail.com";
  const password = "somePassword" as PlainPassword; // NOSONAR
  let loginResult: RefreshResult;
  let refreshResult: RefreshResult;

  describe("full auth flow", () => {
    it("register", async () => {
      const result = await authService.register(email, password);

      if (result.ok) {
        expect(result.value).toEqual({
          id: expect.any(String),
          email: email,
        });
      } else {
        expect.fail("Register should have ended with success");
      }
    });

    it("double register fail", async () => {
      const result = await authService.register(email, password);

      if (result.ok) {
        expect.fail("Register should have failed");
      } else {
        expect(result.error.kind).toBe("USER_ALREADY_EXISTS");
      }
    });

    it("login", async () => {
      const result = await authService.login(email, password);

      if (result.ok) {
        expect(result.value).toEqual({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });

        loginResult = result.value;
      } else {
        expect.fail("Login should have succeeded");
      }
    });

    it("wrong password", async () => {
      const result = await authService.login(
        email,
        "wrongPassword" as PlainPassword,
      );

      if (result.ok) {
        expect.fail("Login should have failed with wrong password");
      } else {
        expect(result.error.kind).toBe("INVALID_CREDENTIALS");
      }
    });

    it("wrong email", async () => {
      const result = await authService.login("wrongemail@gmail.com", password);

      if (result.ok) {
        expect.fail("Login should have failed with wrong password");
      } else {
        expect(result.error.kind).toBe("INVALID_CREDENTIALS");
      }
    });

    it("refresh token", async () => {
      const result = await authService.refresh(loginResult.refreshToken);

      if (result.ok) {
        expect(result.value).toEqual({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });

        refreshResult = result.value;
      } else {
        expect.fail("refresh should have succseeded");
      }
    });

    it("logout", async () => {
      const result = await authService.logout(refreshResult.refreshToken);

      if (result.ok) {
        expect(result.value).toBeUndefined();
      } else {
        expect.fail("logout should have succseeded");
      }
    });

    it("logged out token cannot be reused -> TOKEN_INVALID", async () => {
      const result = await authService.refresh(refreshResult.refreshToken);
      if (result.ok) {
        expect.fail("refresh should have failed");
      } else {
        expect(result.error.kind).toBe("TOKEN_INVALID");
      }
    });

    it("refresh with completely random token -> TOKEN_INVALID", async () => {
      const result = await authService.refresh(
        crypto.randomBytes(32).toString("hex") as RefreshToken,
      );

      if (result.ok) {
        expect.fail("refresh should have failed");
      } else {
        expect(result.error.kind).toBe("TOKEN_INVALID");
      }
    });
  });
});
