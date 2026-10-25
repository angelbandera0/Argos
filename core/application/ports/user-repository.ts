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

export interface UserRepository {
  getProfile(userId: string): Promise<Profile | null>;
}
