import UserRepository from "@src/repositories/user-repository.js";
import type { IUserRepository } from "@src/repository.js";
import type { User } from "@src/types.js";
import { generateRandomUser } from "@tests/helpers/utils.js";

describe("UserRepository", () => {
  let repo: IUserRepository;
  let generatedUser: User;

  beforeEach(async () => {
    repo = new UserRepository();
    generatedUser = await generateRandomUser();
  });

  describe("save", () => {
    it("Should save user", async () => {
      await repo.save(generatedUser);

      const user = await repo.findById(generatedUser.id);

      expect(user).toStrictEqual(generatedUser);
    });
  });

  describe("findByEmail", () => {
    it("should return user if one exists", async () => {
      await repo.save(generatedUser);

      const user = await repo.findByEmail(generatedUser.email);

      expect(user).toStrictEqual(generatedUser);
    });

    it("should return null if user doesn't exist", async () => {
      const repo = new UserRepository();

      const user = await repo.findByEmail(generatedUser.email);

      expect(user).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return user if one exists", async () => {
      await repo.save(generatedUser);

      const user = await repo.findById(generatedUser.id);

      expect(user).toStrictEqual(generatedUser);
    });

    it("should return null if user doesn't exist", async () => {
      const repo = new UserRepository();

      const user = await repo.findById(generatedUser.id);

      expect(user).toBeNull();
    });
  });
});
