import type {
  Profile,
  UserRepository,
} from "@/core/application/ports/user-repository";

export class InMemoryUserRepository implements UserRepository {
  readonly profiles = new Map<string, Profile>();

  async getProfile(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) ?? null;
  }
}
