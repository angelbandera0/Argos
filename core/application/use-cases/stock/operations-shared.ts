import type { Location, LotView } from "@/core/application/ports/stock-repository";
import type { StockOperations, Pick } from "@/core/application/ports/stock-operations";
import type { WriteOffReasonRepository } from "@/core/application/ports/write-off-reason-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { hasSpecial, type SpecialPermission } from "@/core/domain/permissions";
import { nameKey, normalizeName } from "@/core/domain/name";
import {
  allocateChosen,
  capture,
  convertUnits,
  magnitudeOf,
  unitsOf,
  type Unit,
  isFifoDeviation,
  qty,
  suggestFifo,
  toNumber,
  type Allocation,
  type Lot,
  type Qty,
} from "@/core/domain/stock";
import { canSeeCosts, type StockDeps, type StockScope } from "./shared";

export interface StockOpsDeps extends StockDeps {
  ops: StockOperations;
  reasons: WriteOffReasonRepository;
}

/** Admin, or the special permission for the location's scope (warehouse grant / own store). */
export function canDo(scope: StockScope, permission: SpecialPermission, location: Location): boolean {
  if (scope.isAdmin) return true;
  const access = scope.access;
  if (!access) return false;
  return location.kind === "warehouse" ? hasSpecial(access, permission, { warehouse: true }) : location.storeId === access.storeId && hasSpecial(access, permission);
}

export const requireDo = (scope: StockScope, permission: SpecialPermission, location: Location) => {
  if (!canDo(scope, permission, location)) throw new Forbidden();
};

export function positiveQty(raw: number): Qty {
  const q = qty(raw);
  if (q <= 0) throw new RuleViolation("INVALID_QUANTITY");
  return q;
}

export function reasonText(raw: string | undefined, required: boolean, min = 3): string | undefined {
  const text = raw === undefined ? "" : normalizeName(raw);
  if (!text && !required) return undefined;
  if (text.length < min || text.length > 300) throw new RuleViolation("REASON_TEXT_REQUIRED");
  return text;
}

export function costOf(actor: Actor, scope: StockScope, i: { unitCost?: number | null }) {
  if (i.unitCost === undefined || i.unitCost === null) return null;
  if (!canSeeCosts(actor, scope.access)) throw new RuleViolation("COST_NOT_ALLOWED");
  return i.unitCost;
}

export async function resolveConsumption(deps: StockOpsDeps, i: { productId: string; qty: number; unit: string }, location: Location) {
  const config = await deps.stock.getProductConfig(i.productId);
  if (!config) throw new NotFound();
  if (!config.storable) throw new RuleViolation("PRODUCT_NOT_STORABLE");
  const amount = positiveQty(i.qty);
  const key = nameKey(i.unit);
  let baseQty = amount;
  if (key !== "base") {
    const unit = config.movementUnits.find((u) => u.active && nameKey(u.name) === key);
    const presentation = config.presentations.find((p) => p.active && nameKey(p.name) === key);
    if (unit) baseQty = capture(amount, { name: unit.name, equivalence: qty(unit.equivalence) }).base;
    else if (presentation) baseQty = capture(amount, { name: presentation.name, content: qty(presentation.content) }).base;
    else if (unitsOf(magnitudeOf(config.baseUnit)).includes(key as Unit)) baseQty = convertUnits(i.qty, key as Unit, config.baseUnit);
    else throw new RuleViolation("INVALID_UNIT");
  }
  const views = await deps.stock.listLots(i.productId, location.id, { onlyAvailable: true });
  return { baseQty, views };
}

const toLots = (views: LotView[]): Lot[] => views.map((l) => ({ id: l.id, createdAt: l.receivedAt, remaining: qty(l.remaining) }));
const toPicks = (picks: Pick[]) => picks.map((p) => ({ lotId: p.lotId, qty: qty(p.qty) }));
const toOut = (a: Allocation[]) => a.map((x) => ({ lotId: x.lotId, qty: toNumber(x.qty) }));

export function allocate(views: LotView[], baseQty: Qty, picks?: Pick[]) {
  const lots = toLots(views);
  const suggested = suggestFifo(lots, baseQty);
  if (!picks) return { suggested: toOut(suggested), allocation: toOut(suggested), isDeviation: false };
  if (new Set(picks.map((p) => p.lotId)).size !== picks.length) throw new RuleViolation("DUPLICATE_LOT");
  const chosen = allocateChosen(lots, toPicks(picks), baseQty);
  return { suggested: toOut(suggested), allocation: toOut(chosen), isDeviation: isFifoDeviation(lots, chosen, baseQty) };
}

export async function planConsumption(deps: StockOpsDeps, scope: StockScope, location: Location, i: { productId: string; qty: number; unit: string; picks?: Pick[] }) {
  const ctx = await resolveConsumption(deps, i, location);
  const plan = allocate(ctx.views, ctx.baseQty, i.picks);
  if (plan.isDeviation && !canDo(scope, "choose_lot", location)) throw new RuleViolation("CHOOSE_LOT_FORBIDDEN");
  return { ...ctx, ...plan };
}
