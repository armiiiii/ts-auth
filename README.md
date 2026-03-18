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
  const result = await authService.login(req.body.email, req.body.password);
  if (!result.ok) return res.status(401).json({ error: "Invalid credentials" });
  res.json(result.value);
});

// fastify
fastify.post("/login", async (req, reply) => {
  const result = await authService.login(req.body.email, req.body.password);
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



# Contribute
