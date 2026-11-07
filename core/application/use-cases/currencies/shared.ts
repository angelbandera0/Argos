import type { Clock } from "@/core/application/ports/clock";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { CurrencyRepository } from "@/core/application/ports/currency-repository";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader } from "@/core/application/ports/store-access-reader";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";

export interface CurrencyDeps {
  currencies: CurrencyRepository;
  companies: CompanyRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

interface ScopeInput {
  companyId?: string;
  write: boolean;
}

/** Admins reach the companies they administer; operators read their active store's company. */
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
  // T04: permiso del módulo divisas
  if (input.write) throw new Forbidden();
  return { companyId: store.companyId };
}

export async function loadScoped<T extends { companyId: string }>(
  deps: CurrencyDeps,
  actor: Actor,
  input: { write: boolean; load: () => Promise<T | null> },
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
