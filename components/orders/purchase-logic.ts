import { z } from "zod";
import { comparison, type Comparison } from "@/core/domain/orders";
import type { OrderLine } from "@/core/application/ports/order-repository";

export type PurchaseDraft = { lineId: string; bought: boolean | null; qty: string; cost: string };

export const draftFromLine = (l: OrderLine): PurchaseDraft => ({
  lineId: l.id,
  bought: l.qtyBought === null ? null : l.qtyBought > 0,
  qty: l.qtyBought === null ? String(l.qty) : String(l.qtyBought),
  cost: l.unitCost ? String(l.unitCost) : "",
});

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

/** null when the line is complete; otherwise what is missing. */
export function draftIssue(d: PurchaseDraft): string | null {
  if (d.bought === null) return "Marca si lo compraste para poder enviar.";
  if (!d.bought) return null;
  if (!(num(d.qty) > 0)) return "Indica la cantidad comprada.";
  if (!(num(d.cost) >= 0)) return "Indica el costo unitario.";
  return null;
}

export const purchaseReady = (drafts: PurchaseDraft[]) => drafts.length > 0 && drafts.every((d) => draftIssue(d) === null);

/** Unmarked or incomplete lines count as nothing bought so the live total never invents spending. */
export const draftsComparison = (given: number | null, drafts: PurchaseDraft[]): Comparison =>
  comparison(
    given,
    drafts.map((d) => (d.bought && draftIssue(d) === null ? { qtyBought: num(d.qty), unitCost: num(d.cost) } : { qtyBought: 0, unitCost: 0 })),
  );

export const spentByProduct = (names: Record<string, string>, drafts: PurchaseDraft[]) =>
  drafts
    .filter((d) => d.bought && draftIssue(d) === null)
    .map((d) => ({ name: names[d.lineId] ?? "", amount: Math.round(num(d.qty) * num(d.cost) * 100) / 100 }));

export const purchaseSchema = z.object({
  orderId: z.string().min(1),
  lines: z.array(z.object({ lineId: z.string().min(1), qtyBought: z.number().min(0), unitCost: z.number().min(0) })).min(1),
});

export const toPurchaseLines = (drafts: PurchaseDraft[]) =>
  drafts.map((d) => (d.bought ? { lineId: d.lineId, qtyBought: num(d.qty), unitCost: num(d.cost) } : { lineId: d.lineId, qtyBought: 0, unitCost: 0 }));

const ERRORS: Record<string, string> = {
  PURCHASE_INCOMPLETE: "Marca todas las líneas antes de enviar a revisión.",
  INVALID_QUANTITY: "Las cantidades y costos no pueden ser negativos.",
  INVALID_STATUS: "El pedido ya no se puede editar.",
};

export const purchaseErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo guardar la compra. Inténtalo de nuevo.";
