import type { Role, RoleRepository } from "@/core/application/ports/role-repository";

export class InMemoryRoles implements RoleRepository {
  readonly roles = new Map<string, Role>();
  readonly deleted = new Set<string>();
  readonly assigned = new Set<string>();
  private seq = 0;

  markAssigned(roleId: string): void {
    this.assigned.add(roleId);
  }

  async create(role: Omit<Role, "id">): Promise<Role> {
    this.seq += 1;
    const created: Role = { ...role, id: `r${this.seq}` };
    this.roles.set(created.id, created);
    return created;
  }

  async update(id: string, patch: Partial<Omit<Role, "id" | "ownerId">>): Promise<Role> {
    const current = this.roles.get(id);
    if (!current || this.deleted.has(id)) throw new Error(`role ${id} not found`);
    const updated: Role = { ...current, ...patch };
    this.roles.set(id, updated);
    return updated;
  }

  async getById(id: string): Promise<Role | null> {
    return this.deleted.has(id) ? null : (this.roles.get(id) ?? null);
  }

  async listByOwner(ownerId: string): Promise<Role[]> {
    return [...this.roles.values()].filter((r) => r.ownerId === ownerId && !this.deleted.has(r.id));
  }

  async softDelete(id: string): Promise<void> {
    this.deleted.add(id);
  }

  async hasAssignments(roleId: string): Promise<boolean> {
    return this.assigned.has(roleId);
  }
}
