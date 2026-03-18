import { createUser } from "@src/factories/user.js";
import TokenRepository from "@src/repositories/token-repository.js";
import UserRepository from "@src/repositories/user-repository.js";
import type {
  IAuthService,
  ITokenRepository,
  IUserRepository,
} from "@src/repository.js";
import AuthService from "@src/services/auth-service.js";
import { hashPassword } from "@src/services/helpers/password.js";
import { randomRefresh } from "@src/services/helpers/tokens.js";
import type {
  AuthConfig,
  JwtSecret,
  PlainPassword,
  RefreshToken,
  StoredRefreshToken,
  UserId,
} from "@src/types.js";
import {
  generateStoredRefreshTokens,
  generateUserWithId,
  randomPassword,
  randomUserEmail,
} from "@tests/helpers/utils.js";

const testConfig: AuthConfig = {
  jwtSecret: "test-secret-do-not-use" as JwtSecret,
  algorithm: "HS256",
  accessTokenExpiresIn: 15 * 60,
  refreshTokenExpiresIn: 30 * 24 * 60 * 60,
};

describe("AuthService", () => {
  let email: string;
  let password: PlainPassword;
  let tokenRepo: ITokenRepository;
  let userRepo: IUserRepository;
  let storedTokens: StoredRefreshToken[];
  let authService: IAuthService;

  beforeEach(async () => {
    email = randomUserEmail();
    password = randomPassword();

    storedTokens = generateStoredRefreshTokens(10);
    tokenRepo = new TokenRepository();
    for (const token of storedTokens) {
      await tokenRepo.save(token);
    }

    const randomUser = await generateUserWithId(
      storedTokens[0]?.userId as UserId,
    );

    userRepo = new UserRepository();
    await userRepo.save(randomUser);

    authService = new AuthService(userRepo, tokenRepo, testConfig);
  });

  describe("register", () => {
    it("should return PublicUser", async () => {
      const result = await authService.register(email, password);

      if (result.ok) {
        const user = result.value;
        expect(user.email).toBe(email);
      } else {
        expect.fail("User must have been get created");
      }
    });

    it("should return AuthError if user already exists", async () => {
      await authService.register(email, password);

      const result = await authService.register(email, password);
      if (result.ok) {
        expect.fail("User should have been created");
      } else {
        expect(result.error.kind).toBe("USER_ALREADY_EXISTS");
      }
    });
  });

  describe("login", () => {
    it("should return RefreshResult", async () => {
      const hash = await hashPassword(password);

      const userRepo = new UserRepository();

      await userRepo.save(createUser(email, hash));

      const authService = new AuthService(userRepo, tokenRepo, testConfig);

      const result = await authService.login(email, password);

      if (result.ok) {
        expect(result.value).not.toBeNull();
      } else {
        expect.fail("Should have logged in with success");
      }
    });

    it("should return AuthError if user not found", async () => {
      const result = await authService.login(email, password);

      if (result.ok) {
        expect.fail("Login should have failed, because no user exists");
      } else {
        expect(result.error.kind).toBe("INVALID_CREDENTIALS");
      }
    });

    it("should return AuthError if password doesn't match", async () => {
      const hash = await hashPassword(password);

      const userRepo = new UserRepository();

      await userRepo.save(createUser(email, hash));

      const authService = new AuthService(userRepo, tokenRepo, testConfig);

      const result = await authService.login(email, randomPassword());

      if (result.ok) {
        expect.fail("Login should have failed, because password is invalid");
      } else {
        expect(result.error.kind).toBe("INVALID_CREDENTIALS");
      }
    });
  });

  describe("refresh", () => {
    it("should return RefreshResult", async () => {
      const result = await authService.refresh(
        storedTokens[0]?.token as RefreshToken,
      );
      if (result.ok) {
        const { accessToken, refreshToken } = result.value;

        expect(accessToken).not.toBeNull();
        expect(refreshToken).not.toBeNull();
      } else {
        expect.fail("Should have refreshed with success");
      }
    });

    it("should invalidate old token and issue new one", async () => {
      const oldToken = await tokenRepo.findByToken(
        storedTokens[0]?.token as RefreshToken,
      );

      const result = await authService.refresh(
        storedTokens[0]?.token as RefreshToken,
      );

      if (result.ok) {
        const { refreshToken: newToken } = result.value;

        expect(
          await tokenRepo.findByToken(oldToken?.token as RefreshToken),
        ).toBeNull();

        expect(await tokenRepo.findByToken(newToken)).not.toBeNull();
      } else {
        expect.fail("Should have renewed the token");
      }
    });

    it("should return AuthError if refresh is expired", async () => {
      vi.useFakeTimers();

      vi.advanceTimersByTime((testConfig.refreshTokenExpiresIn + 1) * 1000);

      const result = await authService.refresh(
        storedTokens[0]?.token as RefreshToken,
      );

      if (result.ok) {
        expect.fail("Refresh should have failed, because it's expired");
      } else {
        expect(result.error.kind).toBe("TOKEN_EXPIRED");
      }

      vi.useRealTimers();
    });

    it("should return AuthError if refresh doesn't exist in DB", async () => {
      const result = await authService.refresh(randomRefresh());

      if (result.ok) {
        expect.fail("Refresh should have failed, because token doesn't exist");
      } else {
        expect(result.error.kind).toBe("TOKEN_INVALID");
      }
    });
  });

  describe("logout", () => {
    it("should return void", async () => {
      const result = await authService.logout(
        storedTokens[0]?.token as RefreshToken,
      );

      if (result.ok) {
        expect(result.value).toBeUndefined();
      } else {
        expect.fail("Logout should have ended with success");
      }
    });

    it("should delete the refresh token", async () => {
      const result = await authService.logout(
        storedTokens[0]?.token as RefreshToken,
      );

      if (result.ok) {
        const token = await tokenRepo.findByToken(
          storedTokens[0]?.token as RefreshToken,
        );

        expect(token).toBeNull();
      } else {
        expect.fail("Logout should have ended with success");
      }
    });

    it("should return AuthError if token doesn't exist", async () => {
      const tokenRepo = new TokenRepository();
      const authService = new AuthService(userRepo, tokenRepo, testConfig);

      const result = await authService.logout(
        storedTokens[0]?.token as RefreshToken,
      );

      if (result.ok) {
        expect.fail("Logout should have failed, because token doesn't exist");
      } else {
        expect(result.error.kind).toBe("TOKEN_INVALID");
      }
    });
  });
});
