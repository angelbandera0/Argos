import type { ActorKind } from "@/core/domain/actor";

export interface Profile {
  id: string;
  kind: ActorKind;
  username: string | null;
  displayName: string;
  companyId: string | null;
  status: "active" | "locked" | "deactivated";
  mustChangePassword: boolean;
}

export interface Assignment {
  userId: string;
  storeId: string;
  roleId: string;
}

export interface AuthEvent {
  event: "login_ok" | "login_failed" | "locked" | "unlocked" | "pin_reset" | "password_changed";
  channel: "ui" | "api" | "app" | "mcp" | "system";
  createdAt: Date;
}

export interface UserRepository {
  getProfile(userId: string): Promise<Profile | null>;
  /** Also finds deactivated users: usernames are never reused. */
  findByUsername(username: string): Promise<Profile | null>;
  listForCompany(companyId: string): Promise<Profile[]>;
  /** Administrators visible to the caller (RLS); the use case restricts it to the superadmin. */
  listAdmins(): Promise<Profile[]>;
  setStatus(userId: string, status: Profile["status"]): Promise<void>;
  /** REPLACES the user's assignments with the given list. */
  assignStores(
    userId: string,
    assignments: { storeId: string; roleId: string }[],
  ): Promise<void>;
  listAssignments(userId: string): Promise<Assignment[]>;
  /** Most recent first; visible to the administrators of the user's company (RLS). */
  listAuthEvents(userId: string, limit: number): Promise<AuthEvent[]>;
}
