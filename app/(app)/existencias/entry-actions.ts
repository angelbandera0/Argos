"use server";

import { revalidatePath } from "next/cache";
import { entryErrorMessage, entrySchema, fromFamilyUnit, NEW_PRESENTATION, newPresentationContent, UNIT_PREFIX } from "@/components/stock/entry-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireStockUser } from "./guard";

export interface EntryActionState {
  error?: string;
}

export interface EntryConfig {
  baseUnit: string;
  presentations: { name: string; content: number }[];
  canConfigure: boolean;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function loadEntryConfigAction(productId: string): Promise<EntryConfig | null> {
  const { actor, stock, can } = await requireStockUser();
  try {
    const c = await stock.getProductStockConfig(actor, { productId });
    return c.storable ? { baseUnit: c.baseUnit, presentations: c.presentations.filter((p) => p.active).map((p) => ({ name: p.name, content: p.content })), canConfigure: can("configure_units") } : null;
  } catch {
    return null;
  }
}

export async function registerEntryAction(kind: "initial" | "direct", locationId: string, _prev: EntryActionState, f: FormData): Promise<EntryActionState> {
  const { actor, stock, costs, can } = await requireStockUser();
  const p = entrySchema.safeParse({
    productId: text(f, "productId"),
    qty: text(f, "qty"),
    unit: text(f, "unit"),
    content: text(f, "content"),
    cost: costs ? text(f, "cost") : "",
    currencyId: text(f, "currencyId"),
    unknownCost: f.get("unknownCost") === "on",
    newName: text(f, "newName"),
    newQty: text(f, "newQty"),
    newUnit: text(f, "newUnit"),
  });
  if (!p.success) return { error: entryErrorMessage("INVALID_INPUT") };
  const d = p.data;
  const baseUnit = text(f, "baseUnit");
  const withCost = costs && !d.unknownCost && d.cost !== undefined;
  try {
    if (baseUnit && !(await stock.getProductStockConfig(actor, { productId: d.productId })).storable) {
      await stock.saveProductStockConfig(actor, { productId: d.productId, storable: true, baseUnit });
    }
    const config = await stock.getProductStockConfig(actor, { productId: d.productId });
    let { qty, unit, unitCost, price } = { qty: d.qty, unit: d.unit, unitCost: undefined as number | undefined, price: undefined as number | undefined };
    if (withCost) {
      if (d.unit === "base") unitCost = d.cost;
      else price = d.cost;
    }
    let content = d.unit === "base" ? undefined : d.content;
    if (d.unit.startsWith(UNIT_PREFIX)) {
      ({ qty, unitCost } = fromFamilyUnit(d.unit, config.baseUnit, d.qty, price));
      unit = "base";
      price = undefined;
      content = undefined;
    } else if (d.unit === NEW_PRESENTATION) {
      if (!can("configure_units") || !d.newName || !d.newQty || !d.newUnit) return { error: entryErrorMessage("INVALID_INPUT") };
      await stock.addPresentation(actor, { productId: d.productId, name: d.newName, content: newPresentationContent(d.newQty, d.newUnit, config.baseUnit) });
      unit = d.newName;
      content = undefined;
    }
    const input = {
      productId: d.productId,
      locationId,
      qty,
      unit,
      content,
      currencyId: withCost ? d.currencyId || undefined : undefined,
      ...(unitCost !== undefined ? { unitCost } : {}),
      ...(price !== undefined ? { pricePerPresentation: price } : {}),
    };
    await (kind === "initial" ? stock.registerInitialEntry(actor, input) : stock.registerDirectEntry(actor, input));
  } catch (e) {
    if (e instanceof Forbidden) return { error: "No tienes permiso para hacer esto." };
    if (e instanceof NotFound) return { error: "No encontramos el elemento. Recarga la página." };
    return { error: entryErrorMessage(e instanceof RuleViolation ? e.code : undefined) };
  }
  revalidatePath("/existencias", "layout");
  return {};
}
