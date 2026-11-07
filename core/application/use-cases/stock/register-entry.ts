import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { NotFound } from "@/core/domain/errors";
import { nameKey } from "@/core/domain/name";
import { capture, qty, toNumber, unitCostPerBase } from "@/core/domain/stock";
import { loadLocation, scopeOfProduct } from "./shared";
import { costOf, positiveQty, requireDo, type StockOpsDeps } from "./operations-shared";

export interface EntryInput {
  productId: string;
  locationId: string;
  qty: number;
  /** Presentation name, or 'base'. */
  unit: string;
  /** Real content per unit; defaults to the presentation's. */
  content?: number;
  /** Cost per base unit. */
  unitCost?: number;
  /** Price per captured presentation; converted to cost per base unit. */
  pricePerPresentation?: number;
  currencyId?: string;
  receivedAt?: string;
}

export function makeRegisterEntry(deps: StockOpsDeps, kind: "initial" | "direct") {
  return async (actor: Actor, input: EntryInput): Promise<string> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    requireDo(scope, kind === "initial" ? "initial_entry" : "direct_store_entry", location);
    if (location.kind !== (kind === "initial" ? "warehouse" : "store")) throw new RuleViolation(kind === "initial" ? "NOT_WAREHOUSE" : "NOT_STORE");
    const config = await deps.stock.getProductConfig(input.productId);
    if (!config) throw new NotFound();
    if (!config.storable) throw new RuleViolation("PRODUCT_NOT_STORABLE");
    const amount = positiveQty(input.qty);
    const isBase = nameKey(input.unit) === "base";
    const presentation = isBase ? null : config.presentations.find((p) => p.active && nameKey(p.name) === nameKey(input.unit));
    if (!isBase && !presentation) throw new RuleViolation("INVALID_UNIT");
    const override = input.content === undefined ? undefined : positiveQty(input.content);
    const captured = capture(amount, isBase ? { name: config.baseUnit, content: qty(1) } : { name: presentation!.name, content: qty(presentation!.content) }, override);
    const unitCost = costOf(actor, scope, { unitCost: input.pricePerPresentation ?? input.unitCost });
    const perBase = unitCost === null ? null : input.pricePerPresentation !== undefined ? unitCostPerBase(unitCost, captured.content) : unitCost;
    const command = {
      productId: input.productId,
      locationId: location.id,
      qty: toNumber(amount),
      unit: captured.captured.unitName,
      content: toNumber(captured.content),
      unitCost: perBase,
      currencyId: input.currencyId ?? null,
      receivedAt: input.receivedAt,
    };
    return kind === "initial" ? deps.ops.registerInitialEntry(command) : deps.ops.registerDirectEntry(command);
  };
}
