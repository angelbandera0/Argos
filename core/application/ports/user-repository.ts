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

export interface UserRepository {
  getProfile(userId: string): Promise<Profile | null>;
  /** Also finds deactivated users: usernames are never reused. */
  findByUsername(username: string): Promise<Profile | null>;
  listForCompany(companyId: string): Promise<Profile[]>;
  setStatus(userId: string, status: Profile["status"]): Promise<void>;
  /** REPLACES the user's assignments with the given list. */
  assignStores(
    userId: string,
    assignments: { storeId: string; roleId: string }[],
  ): Promise<void>;
  listAssignments(userId: string): Promise<Assignment[]>;
}
