import type {
  Assignment,
  AuthEvent,
  Profile,
  UserRepository,
} from "@/core/application/ports/user-repository";

export class InMemoryUserRepository implements UserRepository {
  readonly profiles = new Map<string, Profile>();
  readonly assignments = new Map<string, Assignment[]>();
  readonly statusCalls: Array<{ userId: string; status: Profile["status"] }> = [];
  readonly assignCalls: Array<{ userId: string; assignments: { storeId: string; roleId: string }[] }> = [];

  async getProfile(userId: string): Promise<Profile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async findByUsername(username: string): Promise<Profile | null> {
    return [...this.profiles.values()].find((p) => p.username === username) ?? null;
  }

  async listForCompany(companyId: string): Promise<Profile[]> {
    return [...this.profiles.values()].filter((p) => p.companyId === companyId);
  }

  async listAdmins(): Promise<Profile[]> {
    return [...this.profiles.values()].filter((p) => p.kind === "admin");
  }

  async setStatus(userId: string, status: Profile["status"]): Promise<void> {
    this.statusCalls.push({ userId, status });
    const profile = this.profiles.get(userId);
    if (profile) this.profiles.set(userId, { ...profile, status });
  }

  async assignStores(
    userId: string,
    assignments: { storeId: string; roleId: string }[],
  ): Promise<void> {
    this.assignCalls.push({ userId, assignments });
    this.assignments.set(
      userId,
      assignments.map((a) => ({ userId, storeId: a.storeId, roleId: a.roleId })),
    );
  }

  async listAssignments(userId: string): Promise<Assignment[]> {
    return this.assignments.get(userId) ?? [];
  }

  async listAuthEvents(): Promise<AuthEvent[]> {
    return [];
  }
}
