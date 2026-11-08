import type { Location, LotView } from "@/core/application/ports/stock-repository";
import type { StockOperations, Pick } from "@/core/application/ports/stock-operations";
import type { WriteOffReasonRepository } from "@/core/application/ports/write-off-reason-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { hasSpecial, type SpecialPermission } from "@/core/domain/permissions";
import { nameKey, normalizeName } from "@/core/domain/name";
import {
  allocateChosen,
  allocateChosenPacks,
  availablePacks,
  capture,
  convertUnits,
  magnitudeOf,
  unitsOf,
  type Unit,
  isFifoDeviation,
  isPackDeviation,
  qty,
  suggestFifo,
  suggestPacksFifo,
  totalQty,
  type PackLot,
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

export type PackRequest = { name: string; count: number };

export async function resolveConsumption(deps: StockOpsDeps, i: { productId: string; qty: number; unit: string }, location: Location) {
  const config = await deps.stock.getProductConfig(i.productId);
  if (!config) throw new NotFound();
  if (!config.storable) throw new RuleViolation("PRODUCT_NOT_STORABLE");
  const amount = positiveQty(i.qty);
  const key = nameKey(i.unit);
  let baseQty: Qty | null = amount;
  let pack: PackRequest | null = null;
  if (key !== "base") {
    const unit = config.movementUnits.find((u) => u.active && nameKey(u.name) === key);
    const presentation = config.presentations.find((p) => p.active && nameKey(p.name) === key);
    if (unit) baseQty = capture(amount, { name: unit.name, equivalence: qty(unit.equivalence) }).base;
    else if (presentation) {
      baseQty = null;
      pack = { name: presentation.name, count: i.qty };
    } else if (unitsOf(magnitudeOf(config.baseUnit)).includes(key as Unit)) baseQty = convertUnits(i.qty, key as Unit, config.baseUnit);
    else throw new RuleViolation("INVALID_UNIT");
  }
  const views = await deps.stock.listLots(i.productId, location.id, { onlyAvailable: true });
  return { baseQty, pack, views };
}

export type ConsumptionCtx = { baseQty: Qty | null; pack: PackRequest | null };

const toLots = (views: LotView[]): Lot[] => views.map((l) => ({ id: l.id, createdAt: l.receivedAt, remaining: qty(l.remaining) }));
const toPackLots = (views: LotView[]): PackLot[] =>
  views.map((l) => ({ id: l.id, createdAt: l.receivedAt, remaining: qty(l.remaining), presentation: l.presentation && { name: l.presentation.name, content: qty(l.presentation.content) } }));
const toPicks = (picks: Pick[]) => picks.map((p) => ({ lotId: p.lotId, qty: qty(p.qty) }));
const toOut = (a: Allocation[]) => a.map((x) => ({ lotId: x.lotId, qty: toNumber(x.qty) }));

/** Packs asked by presentation are taken lot by lot with each lot's own content; picks then count packs per lot. */
export function allocate(views: LotView[], ctx: ConsumptionCtx, picks?: Pick[]) {
  if (ctx.pack) {
    const { name, count } = ctx.pack;
    const lots = toPackLots(views);
    const suggested = suggestPacksFifo(lots, name, count);
    if (picks && new Set(picks.map((p) => p.lotId)).size !== picks.length) throw new RuleViolation("DUPLICATE_LOT");
    const chosen = picks ? allocateChosenPacks(lots, name, picks.map((p) => ({ lotId: p.lotId, packs: p.qty })), count) : suggested;
    const packsOf = (xs: typeof suggested) => xs.map((x) => ({ lotId: x.lotId, qty: x.packs }));
    return {
      baseQty: toNumber(totalQty(chosen)),
      suggested: toOut(suggested),
      allocation: toOut(chosen),
      suggestedPacks: packsOf(suggested),
      allocationPacks: packsOf(chosen),
      isDeviation: picks ? isPackDeviation(lots, name, chosen, count) : false,
    };
  }
  const baseQty = ctx.baseQty!;
  const lots = toLots(views);
  const suggested = suggestFifo(lots, baseQty);
  const base = { baseQty: toNumber(baseQty), suggestedPacks: undefined, allocationPacks: undefined };
  if (!picks) return { ...base, suggested: toOut(suggested), allocation: toOut(suggested), isDeviation: false };
  if (new Set(picks.map((p) => p.lotId)).size !== picks.length) throw new RuleViolation("DUPLICATE_LOT");
  const chosen = allocateChosen(lots, toPicks(picks), baseQty);
  return { ...base, suggested: toOut(suggested), allocation: toOut(chosen), isDeviation: isFifoDeviation(lots, chosen, baseQty) };
}

export const packsAvailable = (views: LotView[], pack: PackRequest) => availablePacks(toPackLots(views), pack.name);

export async function planConsumption(deps: StockOpsDeps, scope: StockScope, location: Location, i: { productId: string; qty: number; unit: string; picks?: Pick[] }) {
  const ctx = await resolveConsumption(deps, i, location);
  const plan = allocate(ctx.views, ctx, i.picks);
  if (plan.isDeviation && !canDo(scope, "choose_lot", location)) throw new RuleViolation("CHOOSE_LOT_FORBIDDEN");
  const opsPicks: Pick[] | undefined = ctx.pack ? plan.allocation : i.picks;
  return { ...ctx, ...plan, opsPicks };
}
