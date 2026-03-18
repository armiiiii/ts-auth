import { generateStoredRefresh } from "@src/factories/stored-refresh-token.js";
import { createUser } from "@src/factories/user.js";
import type {
  IAuthService,
  ITokenRepository,
  IUserRepository,
  RefreshResult,
} from "@src/repository.js";
import { err, ok, type Result } from "@src/result.js";
import type {
  AuthConfig,
  AuthError,
  PlainPassword,
  PublicUser,
  RefreshToken,
  User,
} from "@src/types.js";
import { hashPassword, verifyPassword } from "./helpers/password.js";
import { generateAccessToken, randomRefresh } from "./helpers/tokens.js";

export default class AuthService implements IAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: ITokenRepository,
    private readonly config: AuthConfig,
  ) {}

  async register(
    email: string,
    password: PlainPassword,
  ): Promise<Result<PublicUser, AuthError>> {
    if (await this.userRepository.findByEmail(email)) {
      return err({ kind: "USER_ALREADY_EXISTS" });
    }
    const hash = await hashPassword(password);
    const user: User = createUser(email, hash);
    await this.userRepository.save(user);
    return ok({ id: user.id, email: user.email });
  }

  async login(
    email: string,
    password: PlainPassword,
  ): Promise<Result<RefreshResult, AuthError>> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return err({ kind: "INVALID_CREDENTIALS" });

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) return err({ kind: "INVALID_CREDENTIALS" });

    const refreshResult = await this.issueTokens(user);
    return ok(refreshResult);
  }

  async refresh(
    refreshToken: RefreshToken,
  ): Promise<Result<RefreshResult, AuthError>> {
    const oldStoredRefresh =
      await this.tokenRepository.findByToken(refreshToken);
    if (!oldStoredRefresh) return err({ kind: "TOKEN_INVALID" });

    const user = await this.userRepository.findById(oldStoredRefresh.userId);
    if (!user) return err({ kind: "USER_NOT_FOUND" });

    if (Math.floor(Date.now() / 1000) > oldStoredRefresh.expiresAt) {
      return err({ kind: "TOKEN_EXPIRED" });
    }

    await this.tokenRepository.delete(oldStoredRefresh.id);

    const refreshResult = await this.issueTokens(user);
    return ok(refreshResult);
  }

  private async issueTokens(user: User): Promise<RefreshResult> {
    const accessToken = generateAccessToken(user, this.config);
    const refreshToken = randomRefresh();
    const storedRefresh = generateStoredRefresh(refreshToken, user.id, this.config);
    await this.tokenRepository.save(storedRefresh);
    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: RefreshToken): Promise<Result<void, AuthError>> {
    const token = await this.tokenRepository.findByToken(refreshToken);
    if (!token) return err({ kind: "TOKEN_INVALID" });

    await this.tokenRepository.delete(token.id);
    return ok(undefined);
  }
}
