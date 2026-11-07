import type { Clock } from "@/core/application/ports/clock";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StockRepository, Location } from "@/core/application/ports/stock-repository";
import type { StoreAccess, StoreAccessReader } from "@/core/application/ports/store-access-reader";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { hasSpecial } from "@/core/domain/permissions";
import { qty, toNumber } from "@/core/domain/stock";
import { nameKey, normalizeName } from "@/core/domain/name";

export interface StockDeps {
  stock: StockRepository;
  companies: CompanyRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

export interface StockScope {
  companyId: string;
  isAdmin: boolean;
  access: StoreAccess | null;
}

export const MAX_PAGE_SIZE = 100;

export const invalid = (): never => {
  throw new RuleViolation("INVALID_INPUT");
};

export function pageOf(input: { page?: number; pageSize?: number }) {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.pageSize ?? 20, MAX_PAGE_SIZE);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) invalid();
  return { offset: (page - 1) * pageSize, limit: pageSize };
}

/** Admins reach the companies they administer; operators their active store's company. */
export async function resolveStockScope(deps: StockDeps, actor: Actor, input: { companyId?: string }): Promise<StockScope> {
  if (actor.kind === "admin") {
    if (!input.companyId) throw new Forbidden();
    const admins = await deps.companies.listAdmins(input.companyId);
    if (!admins.includes(actor.userId)) throw new Forbidden();
    return { companyId: input.companyId, isAdmin: true, access: null };
  }
  if (actor.kind !== "operator") throw new Forbidden();
  const { store } = await requireOperatorStore(deps, actor);
  return { companyId: store.companyId, isAdmin: false, access: store };
}

export async function scopeOfProduct(deps: StockDeps, actor: Actor, productId: string): Promise<StockScope> {
  const companyId = await deps.stock.getProductCompany(productId);
  if (!companyId) throw new NotFound();
  const scope = await resolveStockScope(deps, actor, { companyId });
  if (scope.companyId !== companyId) throw new NotFound();
  return scope;
}

export async function loadLocation(deps: StockDeps, scope: StockScope, locationId: string): Promise<Location> {
  const location = await deps.stock.getLocation(locationId);
  if (!location || location.companyId !== scope.companyId) throw new NotFound();
  return location;
}

export const requireView = (scope: StockScope) => {
  if (!scope.isAdmin && !scope.access?.permissions.stock?.view) throw new Forbidden();
};

/** Operators see their own store; the general warehouse only with a special permission granted for it. */
export function canSeeLocation(scope: StockScope, location: Location): boolean {
  if (scope.isAdmin) return true;
  const access = scope.access;
  if (!access?.permissions.stock?.view) return false;
  if (location.kind === "store") return location.storeId === access.storeId;
  return access.specialPermissions.some((g) => g.warehouse);
}

export const canSeeCosts = (actor: Actor, access: Pick<StoreAccess, "specialPermissions"> | null): boolean =>
  actor.kind === "admin" || (access !== null && hasSpecial(access, "see_costs"));

export function stripCosts<T extends { unitCost?: unknown }>(rows: T[], visible: boolean): T[] {
  return visible ? rows : rows.map(({ unitCost: _hidden, ...rest }) => rest as T);
}

export const canConfigureUnits = (scope: StockScope) =>
  scope.isAdmin || (scope.access !== null && hasSpecial(scope.access, "configure_units", { warehouse: true }));

export function canConfigureMinimum(scope: StockScope, location: Location): boolean {
  if (scope.isAdmin) return true;
  const access = scope.access;
  if (!access) return false;
  return location.kind === "warehouse"
    ? hasSpecial(access, "configure_minimums", { warehouse: true })
    : location.storeId === access.storeId && hasSpecial(access, "configure_minimums");
}

export function validateItemName(raw: string): string {
  const name = normalizeName(raw);
  if (name.length < 1 || name.length > 60) throw new RuleViolation("INVALID_NAME");
  return name;
}

export function positiveAmount(raw: number): number {
  const q = qty(raw);
  if (q <= 0) throw new RuleViolation("INVALID_CONTENT");
  return toNumber(q);
}

export async function loadConfigForWrite(deps: StockDeps, actor: Actor, productId: string) {
  const scope = await scopeOfProduct(deps, actor, productId);
  if (!canConfigureUnits(scope)) throw new Forbidden();
  const config = await deps.stock.getProductConfig(productId);
  if (!config) throw new NotFound();
  return config;
}

export function assertNameFree(items: { id: string; name: string }[], name: string, exceptId?: string) {
  const key = nameKey(name);
  if (items.some((i) => i.id !== exceptId && nameKey(i.name) === key)) throw new RuleViolation("NAME_TAKEN");
}

export function findItem<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((i) => i.id === id);
  if (!item) throw new NotFound();
  return item;
}
