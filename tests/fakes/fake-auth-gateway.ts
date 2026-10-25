import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { InMemoryUserRepository } from "./in-memory-user-repository";

export class FakeAuthGateway implements AuthGateway {
  readonly passwords: Record<string, string> = {};
  readonly setPasswordCalls: Array<{ userId: string; password: string }> = [];
  private sequence = 0;

  constructor(private readonly users: InMemoryUserRepository) {}

  async createAdminUser(i: { email: string; displayName: string }) {
    this.sequence += 1;
    const userId = `admin-${this.sequence}`;
    this.users.profiles.set(userId, {
      id: userId,
      kind: "admin",
      username: null,
      displayName: i.displayName,
      companyId: null,
      status: "active",
      mustChangePassword: true,
    });
    return { userId, temporaryPassword: `temp-pass-${this.sequence}-Xk93` };
  }

  async createOperatorUser(): Promise<{ userId: string; pin: string }> {
    throw new Error("not implemented in fake");
  }

  async resetPin(): Promise<{ pin: string }> {
    throw new Error("not implemented in fake");
  }

  async setPassword(userId: string, password: string): Promise<void> {
    this.setPasswordCalls.push({ userId, password });
    this.passwords[userId] = password;
    const profile = this.users.profiles.get(userId);
    if (profile) {
      this.users.profiles.set(userId, { ...profile, mustChangePassword: false });
    }
  }

  async revokeSessions(): Promise<void> {
    throw new Error("not implemented in fake");
  }

  async ensureSuperadmin(): Promise<{ created: boolean }> {
    throw new Error("not implemented in fake");
  }
}
