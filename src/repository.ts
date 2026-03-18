import type { Result } from "./result.js";
import type {
  AccessToken,
  AuthError,
  PlainPassword,
  PublicUser,
  RefreshToken,
  StoredRefreshToken,
  StoredRefreshTokenId,
  User,
  UserId,
} from "./types.js";

export type RefreshResult = {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
};

export interface IAuthService {
  register(
    email: string,
    password: PlainPassword,
  ): Promise<Result<PublicUser, AuthError>>;

  login(
    email: string,
    password: PlainPassword,
  ): Promise<Result<RefreshResult, AuthError>>;

  refresh(
    refreshToken: RefreshToken,
  ): Promise<Result<RefreshResult, AuthError>>;

  logout(refreshToken: RefreshToken): Promise<Result<void, AuthError>>;
}

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface ITokenRepository {
  findByToken(refreshToken: RefreshToken): Promise<StoredRefreshToken | null>;
  save(refreshToken: StoredRefreshToken): Promise<void>;
  delete(id: StoredRefreshTokenId): Promise<void>;
  deleteAllForUser(userId: UserId): Promise<void>;
}
