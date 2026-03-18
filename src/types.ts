type Brand<B> = { readonly _brand: B };
type Branded<T, B> = T & Brand<B>;

export type PlainPassword = Branded<string, "PlainPassword">;
export type PasswordHash = Branded<string, "PasswordHash">;
export type UserId = Branded<string, "UserId">;

export type User = {
  id: UserId;
  email: string;
  passwordHash: PasswordHash;
  createdAt: number;
  updatedAt: number;
};

export type PublicUser = {
  id: UserId;
  email: string;
};

export type AccessTokenPayload = {
  sub: UserId;
  email: string;
  iat: number;
  exp: number;
};

export type AccessToken = Branded<string, "AccessToken">;
export type RefreshToken = Branded<string, "RefreshToken">;

export type StoredRefreshTokenId = Branded<string, "StoredRefreshTokenId">;
export type StoredRefreshToken = {
  id: StoredRefreshTokenId;
  userId: UserId;
  token: RefreshToken;
  expiresAt: number;
  createdAt: number;
};

export type JwtSecret = Branded<string, "JwtSecret">;
export type AuthConfig = {
  algorithm: "HS256" | "RS256";
  accessTokenExpiresIn: number; // Seconds
  refreshTokenExpiresIn: number; // Seconds
  jwtSecret: JwtSecret;
};
type ErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_ALREADY_EXISTS"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "TOKEN_NOT_FOUND"
  | "USER_NOT_FOUND";
export type AuthError = {
  kind: ErrorCode;
};
