import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { InMemoryUserRepository } from "./in-memory-user-repository";

export class FakeAuthGateway implements AuthGateway {
  readonly passwords: Record<string, string> = {};
  readonly setPasswordCalls: Array<{ userId: string; password: string }> = [];
  readonly createOperatorCalls: Array<{ username: string; companyId: string; displayName: string }> = [];
  readonly resetPinCalls: string[] = [];
  readonly revokedSessions: string[] = [];
  private sequence = 0;
  private pinCounter = 0;

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

  private nextPin(): string {
    this.pinCounter += 1;
    return String(100000 + this.pinCounter);
  }

  async createOperatorUser(i: {
    username: string;
    companyId: string;
    displayName: string;
  }): Promise<{ userId: string; pin: string }> {
    this.createOperatorCalls.push(i);
    this.sequence += 1;
    const userId = `operator-${this.sequence}`;
    this.users.profiles.set(userId, {
      id: userId,
      kind: "operator",
      username: i.username,
      displayName: i.displayName,
      companyId: i.companyId,
      status: "active",
      mustChangePassword: false,
    });
    return { userId, pin: this.nextPin() };
  }

  async resetPin(userId: string): Promise<{ pin: string }> {
    this.resetPinCalls.push(userId);
    return { pin: this.nextPin() };
  }

  async setPassword(userId: string, password: string): Promise<void> {
    this.setPasswordCalls.push({ userId, password });
    this.passwords[userId] = password;
    const profile = this.users.profiles.get(userId);
    if (profile) {
      this.users.profiles.set(userId, { ...profile, mustChangePassword: false });
    }
  }

  async revokeSessions(userId: string): Promise<void> {
    this.revokedSessions.push(userId);
  }

  async ensureSuperadmin(): Promise<{ created: boolean }> {
    throw new Error("not implemented in fake");
  }
}
