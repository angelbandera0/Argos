import type { Module, PermissionSet } from "@/core/domain/permissions";

export interface Role {
  id: string;
  ownerId: string;
  name: string;
  sessionSeconds: number | null;
  excludedCompanyIds: string[];
  permissions: Record<Module, PermissionSet>;
}

export interface RoleUser {
  roleId: string;
  userId: string;
  displayName: string;
}

export interface RoleRepository {
  create(role: Omit<Role, "id">): Promise<Role>;
  update(id: string, patch: Partial<Omit<Role, "id" | "ownerId">>): Promise<Role>;
  getById(id: string): Promise<Role | null>;
  listByOwner(ownerId: string): Promise<Role[]>;
  softDelete(id: string): Promise<void>;
  hasAssignments(roleId: string): Promise<boolean>;
  /** Distinct users assigned to each of the roles (RLS decides which are visible). */
  listUsers(roleIds: string[]): Promise<RoleUser[]>;
}
