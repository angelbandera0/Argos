import type { CatalogRepository } from "@/core/application/ports/catalog-repository";
import type { Clock } from "@/core/application/ports/clock";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader } from "@/core/application/ports/store-access-reader";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";
import type { Op } from "@/core/domain/permissions";

export interface CatalogDeps {
  catalog: CatalogRepository;
  companies: CompanyRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

export type Resource = "category" | "product";

interface ScopeInput {
  companyId?: string;
  op: Op;
  resource: Resource;
}

/**
 * Who may touch which company's catalog. Admins reach the companies they administer; operators
 * only their active store's company (categories are admin-only except to view, DR-007);
 * superadmins never. Runs before any lookup that could leak state.
 */
export async function resolveCatalogScope(
  deps: CatalogDeps,
  actor: Actor,
  input: ScopeInput,
): Promise<{ companyId: string }> {
  if (actor.kind === "admin") {
    if (!input.companyId) throw new Forbidden();
    const admins = await deps.companies.listAdmins(input.companyId);
    if (!admins.includes(actor.userId)) throw new Forbidden();
    return { companyId: input.companyId };
  }
  if (actor.kind !== "operator") throw new Forbidden();
  const { store } = await requireOperatorStore(deps, actor);
  if (input.resource === "category" && input.op !== "view") throw new Forbidden();
  if (!store.permissions.products[input.op]) throw new Forbidden();
  return { companyId: store.companyId };
}

/** Loads an entity the actor may act on: Forbidden/NotFound ordering per the catalog rulings. */
export async function loadScoped<T extends { companyId: string }>(
  deps: CatalogDeps,
  actor: Actor,
  input: { op: Op; resource: Resource; load: () => Promise<T | null> },
): Promise<T> {
  if (actor.kind === "admin") {
    const entity = await input.load();
    if (!entity) throw new NotFound();
    await resolveCatalogScope(deps, actor, { ...input, companyId: entity.companyId });
    return entity;
  }
  const { companyId } = await resolveCatalogScope(deps, actor, input);
  const entity = await input.load();
  if (!entity || entity.companyId !== companyId) throw new NotFound();
  return entity;
}
