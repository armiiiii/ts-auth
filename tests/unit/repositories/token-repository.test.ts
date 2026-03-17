import TokenRepository from "@src/repositories/token-repository.js";
import type { ITokenRepository } from "@src/repository.js";
import type {
  RefreshToken,
  StoredRefreshToken,
  StoredRefreshTokenId,
} from "@src/types.js";
import {
  generateStoredRefreshTokens,
  generateStoredRefreshTokensForUserId,
  randomStoredTokenId,
  randomUserId,
} from "@tests/helpers/utils.js";

describe("TokenRepository", () => {
  let generatedTokens: StoredRefreshToken[];
  let repo: ITokenRepository;

  const getToken = (n: number) => generatedTokens[n]?.token as RefreshToken;
  const prepopulateRepo = async (
    repo: ITokenRepository,
    tokens: StoredRefreshToken[],
  ) => {
    for (const token of tokens) {
      await repo.save(token);
    }
  };

  beforeEach(async () => {
    generatedTokens = generateStoredRefreshTokens(10);

    repo = new TokenRepository();
    await prepopulateRepo(repo, generatedTokens);
  });

  describe("findByToken", () => {
    it("Should return if token exists", async () => {
      const token = await repo.findByToken(getToken(0));

      expect(token).not.toBeNull();
      expect(token).toStrictEqual(generatedTokens[0]);
    });

    it("Should return null if token doesn't exist", async () => {
      const emptyRepo = new TokenRepository();

      const nullToken = await emptyRepo.findByToken(getToken(0));
      expect(nullToken).toBeNull();
    });
  });

  describe("save", () => {
    it("Should save the token", async () => {
      const repo = new TokenRepository();

      await repo.save(generatedTokens[0] as StoredRefreshToken);

      const token = await repo.findByToken(getToken(0));

      expect(token).not.toBeNull();
      expect(token).toStrictEqual(generatedTokens[0]);
    });
  });

  describe("delete", () => {
    it("should delete the existing token", async () => {
      await repo.delete(generatedTokens[0]?.id as StoredRefreshTokenId);

      const token = await repo.findByToken(getToken(0));

      expect(token).toBeNull();
    });

    it("should fail silently", async () => {
      const emptyRepo = new TokenRepository();

      await emptyRepo.delete(randomStoredTokenId());
    });
  });

  describe("deleteAllForUser", () => {
    const getAllTokensFromArray = async (
      repo: ITokenRepository,
      arr: StoredRefreshToken[],
    ) => {
      const promises = [];
      for (const element of arr) {
        promises.push(repo.findByToken(element.token));
      }
      return await Promise.all(promises);
    };

    it("Should delete every token for user id", async () => {
      const userId = randomUserId();
      const withUserId = generateStoredRefreshTokensForUserId(3, userId);
      const withoutUserId = generateStoredRefreshTokens(7);
      const tokens = [...withUserId, ...withoutUserId];

      const repo = new TokenRepository();
      await prepopulateRepo(repo, tokens);

      await repo.deleteAllForUser(userId);

      const deletedTokens = await getAllTokensFromArray(repo, withUserId);

      const remainedTokens = await getAllTokensFromArray(repo, withoutUserId);

      deletedTokens.forEach((token) => {
        expect(token).toBeNull();
      });

      remainedTokens.forEach((token) => {
        expect(token).not.toBeNull();
      });
    });
  });
});
