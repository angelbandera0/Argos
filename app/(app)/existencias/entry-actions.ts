"use server";

import { revalidatePath } from "next/cache";
import { entryErrorMessage, entrySchema } from "@/components/stock/entry-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireStockUser } from "./guard";

export interface EntryActionState {
  error?: string;
}

export interface EntryConfig {
  baseUnit: string;
  presentations: { name: string; content: number }[];
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function loadEntryConfigAction(productId: string): Promise<EntryConfig | null> {
  const { actor, stock } = await requireStockUser();
  try {
    const c = await stock.getProductStockConfig(actor, { productId });
    return c.storable ? { baseUnit: c.baseUnit, presentations: c.presentations.filter((p) => p.active).map((p) => ({ name: p.name, content: p.content })) } : null;
  } catch {
    return null;
  }
}

export async function registerEntryAction(kind: "initial" | "direct", locationId: string, _prev: EntryActionState, f: FormData): Promise<EntryActionState> {
  const { actor, stock, costs } = await requireStockUser();
  const p = entrySchema.safeParse({
    productId: text(f, "productId"),
    qty: text(f, "qty"),
    unit: text(f, "unit"),
    content: text(f, "content"),
    cost: costs ? text(f, "cost") : "",
    currencyId: text(f, "currencyId"),
    unknownCost: f.get("unknownCost") === "on",
  });
  if (!p.success) return { error: entryErrorMessage("INVALID_INPUT") };
  const d = p.data;
  const baseUnit = text(f, "baseUnit");
  const withCost = costs && !d.unknownCost && d.cost !== undefined;
  try {
    if (baseUnit && !(await stock.getProductStockConfig(actor, { productId: d.productId })).storable) {
      await stock.saveProductStockConfig(actor, { productId: d.productId, storable: true, baseUnit });
    }
    const input = {
      productId: d.productId,
      locationId,
      qty: d.qty,
      unit: d.unit,
      content: d.unit === "base" ? undefined : d.content,
      currencyId: withCost ? d.currencyId || undefined : undefined,
      ...(withCost ? (d.unit === "base" ? { unitCost: d.cost } : { pricePerPresentation: d.cost }) : {}),
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
