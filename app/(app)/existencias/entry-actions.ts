"use server";

import { revalidatePath } from "next/cache";
import { deriveBaseUnit, entryErrorMessage, entrySchema, BULK, fromFamilyUnit, NEW_PRESENTATION, newPresentationContent, UNIT_PREFIX } from "@/components/stock/entry-logic";
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
    bulkUnit: text(f, "bulkUnit"),
    contentQty: text(f, "contentQty"),
    contentUnit: text(f, "contentUnit"),
    cost: costs ? text(f, "cost") : "",
    currencyId: text(f, "currencyId"),
    unknownCost: f.get("unknownCost") === "on",
    newName: text(f, "newName"),
  });
  if (!p.success) return { error: entryErrorMessage("INVALID_INPUT") };
  const d = p.data;
  const withCost = costs && !d.unknownCost && d.cost !== undefined;
  try {
    if (!(await stock.getProductStockConfig(actor, { productId: d.productId })).storable) {
      const baseUnit = deriveBaseUnit(d.unit === BULK, d.bulkUnit, d.contentUnit);
      if (!baseUnit || !can("configure_units")) return { error: entryErrorMessage("PRODUCT_NOT_STORABLE") };
      await stock.saveProductStockConfig(actor, { productId: d.productId, storable: true, baseUnit });
    }
    const config = await stock.getProductStockConfig(actor, { productId: d.productId });
    let { qty, unit, content } = { qty: d.qty, unit: d.unit, content: undefined as number | undefined };
    const unitCost = withCost ? d.cost : undefined;
    if (d.unit === BULK) {
      const u = d.bulkUnit || config.baseUnit;
      unit = "base";
      if (u !== config.baseUnit) qty = fromFamilyUnit(UNIT_PREFIX + u, config.baseUnit, d.qty).qty;
    } else {
      if (!d.contentQty || !d.contentUnit) return { error: entryErrorMessage("INVALID_INPUT") };
      const entered = newPresentationContent(d.contentQty, d.contentUnit, config.baseUnit);
      if (d.unit === NEW_PRESENTATION) {
        if (!can("configure_units") || !d.newName) return { error: entryErrorMessage("INVALID_INPUT") };
        await stock.addPresentation(actor, { productId: d.productId, name: d.newName, content: entered });
        unit = d.newName;
      } else if (entered !== config.presentations.find((x) => x.name === d.unit)?.content) {
        content = entered;
      }
    }
    const input = {
      productId: d.productId,
      locationId,
      qty,
      unit,
      content,
      currencyId: withCost ? d.currencyId || undefined : undefined,
      ...(unitCost !== undefined ? { unitCost } : {}),
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
