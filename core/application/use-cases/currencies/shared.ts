import type { Clock } from "@/core/application/ports/clock";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { CurrencyRepository } from "@/core/application/ports/currency-repository";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader } from "@/core/application/ports/store-access-reader";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";
import type { Op } from "@/core/domain/permissions";

export interface CurrencyDeps {
  currencies: CurrencyRepository;
  companies: CompanyRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

interface ScopeInput {
  companyId?: string;
  op: Op;
}

/** Admins reach the companies they administer; operators their active store's company with the currencies module permission. */
export async function resolveCurrencyScope(
  deps: CurrencyDeps,
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
  if (!store.permissions.currencies?.[input.op]) throw new Forbidden();
  return { companyId: store.companyId };
}

export async function loadScoped<T extends { companyId: string }>(
  deps: CurrencyDeps,
  actor: Actor,
  input: { op: Op; load: () => Promise<T | null> },
): Promise<T> {
  if (actor.kind === "admin") {
    const entity = await input.load();
    if (!entity) throw new NotFound();
    await resolveCurrencyScope(deps, actor, { ...input, companyId: entity.companyId });
    return entity;
  }
  const { companyId } = await resolveCurrencyScope(deps, actor, input);
  const entity = await input.load();
  if (!entity || entity.companyId !== companyId) throw new NotFound();
  return entity;
}
