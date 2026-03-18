# ts-auth

**Drop auth into any Node.js backend without coupling your codebase to a specific framework or database.**

<img src="./f496bf9596dc8e88d1af4835dd436f67.jpg" alt="JWT token image" />

# Installation

```bash
npm install @krmiii/ts-auth
```

# Usage

Library is framework independent, you can use it with _any framework you like_.

```typescript
import {
  AuthService,
  createSecret,
  UserRepository,
  TokenRepository,
  type AuthConfig,
  type PlainPassword,
} from "@krmiii/ts-auth";
import crypto from "node:crypto";

const secret = createSecret(crypto.randomBytes(32).toString("hex"));

const config: AuthConfig = {
  algorithm: "HS256",
  accessTokenExpiresIn: 15 * 60, // Seconds
  refreshTokenExpiresIn: 30 * 24 * 60 * 60, // Seconds
  jwtSecret: secret,
};

const userRepo = new UserRepository();
const tokenRepo = new TokenRepository();

const authService = new AuthService(userRepo, tokenRepo, config);

// express
app.post("/login", async (req, res) => {
  const result = await authService.login(
    req.body.email,
    req.body.password as PlainPassword,
  );
  if (!result.ok) return res.status(401).json({ error: "Invalid credentials" });
  res.json(result.value);
});

// fastify
fastify.post("/login", async (req, reply) => {
  const result = await authService.login(
    req.body.email,
    req.body.password as PlainPassword,
  );
  if (!result.ok)
    return reply.status(401).send({ error: "Invalid credentials" });
  return result.value;
});
```

### Plug-in UserRepository and TokenRepository

`UserRepository` and `TokenRepository` are default in-memory storage providers. They can be replaced with your own storage providers, so you can plug any other database you want to.

```typescript
// user-repository.ts
import { Pool } from "pg";
import type { IUserRepository, User, UserId } from "@krmiii/ts-auth";

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: UserId): Promise<User | null> {
    const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    return result.rows[0] ?? null;
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
       SET email = $2, password_hash = $3, updated_at = $5`,
      [user.id, user.email, user.passwordHash, user.createdAt, user.updatedAt],
    );
  }
}
```

Then in main.ts:

```typescript
// main.ts
import { Pool } from "pg";
import { AuthService, TokenRepository } from "@krmiii/ts-auth";
import { PostgresUserRepository } from "./path/to/user-repository";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const userRepo = new PostgresUserRepository(pool);
const tokenRepo = new TokenRepository();

const auth = new AuthService(userRepo, tokenRepo, config);
```

# Documentation

### AuthConfig

That's all of the configuration you'll need to provide.
| Field | Type | Description |
| --------------------- | -------------- | ------------------------------------------------------------------- |
| jwtSecret | JwtSecret | User generated Secret Token for signing and verifying Access Tokens |
| algorithm | HS256 or RS256 | Algorithm to use for signing Access Tokens |
| refreshTokenExpiresIn | number | Refresh token expiration time in seconds |
| accessTokenExpiresIn | number | Access token expiration time in seconds |

```typescript
export type AuthConfig = {
  algorithm: "HS256" | "RS256";
  accessTokenExpiresIn: number; // Seconds
  refreshTokenExpiresIn: number; // Seconds
  jwtSecret: JwtSecret;
};

// Example
const config: AuthConfig = {
  algorithm: "HS256",
  accessTokenExpiresIn: 15 * 60,
  refreshTokenExpiresIn: 30 * 24 * 60 * 60,
  jwtSecret: createSecret(crypto.randomBytes(32).toString("hex")),
};
```

### AuthService

`AuthService` is a functionality provider. You're going to use it inside of your endpoints.

```typescript
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
```

### Types

#### PublicUser

`PublicUser` is a representation that service return when `register` operation succedes. It hides the vulnarable information that is going to be stored in the database (`User` type is the original Stored User type).

| Field | Type   | Description                                    |
| ----- | ------ | ---------------------------------------------- |
| id    | UserId | Randomly generated 8 bytes long string         |
| email | string | Email provided by the user during registration |

```typescript
export type PublicUser = {
  id: UserId;
  email: string;
};
```

#### RefreshResult

`RefreshResult` is the result of `refresh` and `login` operations.

| Field        | Type         | Description                                                              |
| ------------ | ------------ | ------------------------------------------------------------------------ |
| accessToken  | AccessToken  | AccessToken signed with JwtSecret you've provided earlier                |
| refreshToken | RefreshToken | Randomly generated string of 16 bytes long in hexidecimal representation |

```typescript
export type RefreshResult = {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
};
```

#### AuthError

`AuthError` is an object which tells what kind of an error was returned.

```typescript
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
```

#### Result

`Result` is a returned type of any operation that happens in the service, expressed in a functional way.

| Field | Type       | Description                                           |
| ----- | ---------- | ----------------------------------------------------- |
| ok    | boolean    | Flag that tells whethere operation ended successfully |
| error | AuthError? | Returned value if ok is false                         |
| value | T?         | Returned value if ok is true                          |

You can check if the returned result `ok` or `err` with `isOk()` and `isErr()` appropriately

```typescript
import { isErr, isOk, decodeAccessToken } from "@krmiii/ts-auth";

// Handling register
app.post("/register", async (req, res) => {
  const result = await authService.register(req.body.email, req.body.password);

  if (isOk(result)) {
    return res.status(201).json(result.value); // PublicUser
  }

  if (result.error.kind === "USER_ALREADY_EXISTS") {
    return res.status(409).json({ error: "Email already in use" });
  }

  res.status(500).json({ error: "Something went wrong" });
});
```

### decodeAccessToken

`decodeAccessToken` is a helper function which verifies and extracts `AccessTokenPayload` from Access Token.

```typescript
import { isErr, decodeAccessToken } from "@krmiii/ts-auth";

// Protecting a route — middleware example
app.use("/protected", (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] as AccessToken;
  const result = decodeAccessToken(token, config.jwtSecret);

  if (isErr(result)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = result.value; // AccessTokenPayload
  next();
});
```
