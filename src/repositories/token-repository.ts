import type { ITokenRepository } from "../repository.js";
import type {
  RefreshToken,
  StoredRefreshToken,
  StoredRefreshTokenId,
  UserId,
} from "../types.js";

export default class TokenRepository implements ITokenRepository {
  private readonly mapByRefreshToken: Map<RefreshToken, StoredRefreshToken> =
    new Map();
  private readonly mapByStoredRefreshTokenId: Map<
    StoredRefreshTokenId,
    StoredRefreshToken
  > = new Map();

  async findByToken(
    refreshToken: RefreshToken,
  ): Promise<StoredRefreshToken | null> {
    if (this.mapByRefreshToken.has(refreshToken)) {
      return this.mapByRefreshToken.get(refreshToken) as StoredRefreshToken;
    } else {
      return null;
    }
  }

  async save(refreshToken: StoredRefreshToken): Promise<void> {
    this.mapByRefreshToken.set(refreshToken.token, refreshToken);
    this.mapByStoredRefreshTokenId.set(refreshToken.id, refreshToken);
  }

  async delete(id: StoredRefreshTokenId): Promise<void> {
    if (this.mapByStoredRefreshTokenId.has(id)) {
      const toRemove = this.mapByStoredRefreshTokenId.get(
        id,
      ) as StoredRefreshToken;
      this.mapByRefreshToken.delete(toRemove.token);
      this.mapByStoredRefreshTokenId.delete(id);
    }
  }

  async deleteAllForUser(userId: UserId): Promise<void> {
    const toDelete = [];
    for (const entry of this.mapByRefreshToken.entries()) {
      const storedToken = entry[1];
      if (storedToken.userId === userId) toDelete.push(storedToken);
    }

    for (const token of toDelete) {
      this.delete(token.id);
    }
  }
}
