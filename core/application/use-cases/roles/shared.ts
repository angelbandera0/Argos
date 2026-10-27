import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Role, RoleRepository } from "@/core/application/ports/role-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import { assertValidPermissions } from "@/core/domain/permissions";

export const MAX_SESSION_SECONDS = 86400;
const MAX_NAME_LENGTH = 80;

export function assertAdmin(actor: Actor): void {
  if (actor.kind !== "admin") throw new Forbidden();
}

export function normalizeName(raw: string): string {
  const name = raw.trim();
  if (name.length < 1 || name.length > MAX_NAME_LENGTH) throw new RuleViolation("INVALID_NAME");
  return name;
}

export function assertSessionSeconds(s: number | null): void {
  if (s === null) return;
  if (!Number.isInteger(s) || s <= 0) throw new RuleViolation("INVALID_SESSION_SECONDS");
  if (s > MAX_SESSION_SECONDS) throw new RuleViolation("SESSION_TOO_LONG");
}

export function assertPermissions(permissions: Role["permissions"]): void {
  for (const set of Object.values(permissions)) assertValidPermissions(set);
}

export async function assertNameFree(
  roles: RoleRepository,
  ownerId: string,
  name: string,
  exceptRoleId?: string,
): Promise<void> {
  const key = name.toLowerCase();
  const mine = await roles.listByOwner(ownerId);
  if (mine.some((r) => r.id !== exceptRoleId && r.name.trim().toLowerCase() === key)) {
    throw new RuleViolation("NAME_TAKEN");
  }
}

export async function assertCompaniesAccessible(
  companies: CompanyRepository,
  actor: Actor,
  companyIds: string[],
): Promise<void> {
  await mergeExclusions(companies, actor, [], companyIds);
}

export async function mergeExclusions(
  companies: CompanyRepository,
  actor: Actor,
  current: string[],
  requested: string[],
): Promise<string[]> {
  const allowed = new Set((await companies.listForActor(actor)).map((c) => c.id));
  if (requested.some((id) => !allowed.has(id))) throw new Forbidden();
  return [...new Set([...current.filter((id) => !allowed.has(id)), ...requested])];
}

export async function loadOwnedRole(roles: RoleRepository, actor: Actor, id: string): Promise<Role> {
  const role = await roles.getById(id);
  if (!role || role.ownerId !== actor.userId) throw new Forbidden();
  return role;
}
