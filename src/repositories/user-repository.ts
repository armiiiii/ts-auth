import type { IUserRepository } from "@src/repository.js";
import type { User, UserId } from "@src/types.js";

export default class UserRepository implements IUserRepository {
  private readonly mapByUserId: Map<UserId, User> = new Map();
  private readonly mapByEmail: Map<string, User> = new Map();

  async findById(id: UserId): Promise<User | null> {
    if (this.mapByUserId.has(id)) {
      return this.mapByUserId.get(id) as User;
    } else {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.mapByEmail.has(email)) {
      return this.mapByEmail.get(email) as User;
    } else {
      return null;
    }
  }

  async save(user: User): Promise<void> {
    this.mapByEmail.set(user.email, user);
    this.mapByUserId.set(user.id, user);
  }
}
