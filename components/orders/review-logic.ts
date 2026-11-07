import { z } from "zod";
import type { OrderLine } from "@/core/application/ports/order-repository";
import type { OrderStatus, StorePart } from "@/core/domain/orders";
import type { OrderEvent, OrderEventKind } from "@/core/application/ports/order-repository";
import type { TimelineStep } from "@/components/ui/state-timeline";

const r3 = (n: number) => Number(n.toFixed(3));
const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

export type ReviewDraft = { lineId: string; received: string; split: Record<string, number> };

export const draftFromReview = (l: OrderLine): ReviewDraft => ({
  lineId: l.id,
  received: String(l.qtyReceived ?? l.qtyBought ?? 0),
  split: {},
});

/** Direct lines without a plan need the split among stores when something is received (M2-D10). */
export const needsSplit = (l: OrderLine) => l.dest === "direct" && l.plan.length === 0;

export const splitTotal = (d: ReviewDraft) => r3(Object.values(d.split).reduce((s, v) => s + v, 0));

export function reviewIssue(l: OrderLine, d: ReviewDraft): string | null {
  const q = num(d.received);
  if (!(q >= 0)) return "Indica la cantidad recibida.";
  if (needsSplit(l) && q > 0 && splitTotal(d) !== r3(q)) return "Reparte lo recibido entre las tiendas hasta sumar la cantidad.";
  return null;
}

export const reviewReady = (lines: OrderLine[], drafts: ReviewDraft[]) =>
  lines.every((l) => reviewIssue(l, drafts.find((d) => d.lineId === l.id) as ReviewDraft) === null);

export const missing = (bought: number | null, received: number) => r3(Math.max(0, (bought ?? 0) - received));
export const surplus = (bought: number | null, received: number) => r3(Math.max(0, received - (bought ?? 0)));

/** Faltante valorado; null when the unit cost is hidden or unknown. */
export const shortageOf = (bought: number | null, received: number, unitCost: number | null | undefined) =>
  unitCost == null ? null : Math.round(missing(bought, received) * unitCost * 100) / 100;

export const toReviewLines = (lines: OrderLine[], drafts: ReviewDraft[]) =>
  drafts.map((d) => {
    const reparto: StorePart[] = Object.entries(d.split).filter(([, q]) => q > 0).map(([storeId, qty]) => ({ storeId, qty }));
    const l = lines.find((x) => x.id === d.lineId) as OrderLine;
    return { lineId: d.lineId, qtyReceived: num(d.received), ...(needsSplit(l) && reparto.length ? { reparto } : {}) };
  });

const part = z.object({ storeId: z.string().min(1), qty: z.number().positive() });
const reviewLines = z.array(z.object({ lineId: z.string().min(1), qtyReceived: z.number().min(0), reparto: z.array(part).optional() })).min(1);

export const reviewSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("save"), orderId: z.string().min(1), lines: reviewLines }),
  z.object({ kind: z.literal("confirm"), orderId: z.string().min(1), lines: reviewLines }),
  z.object({ kind: z.literal("return"), orderId: z.string().min(1), note: z.string().trim().min(3).max(500) }),
]);

export const adjustSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(3).max(300),
  lotId: z.string().min(1),
  delta: z.number().refine((n) => n !== 0),
});

const ERRORS: Record<string, string> = {
  BUYER_CANNOT_REVIEW: "Quien compró el pedido no puede revisarlo.",
  INVALID_STATUS: "El pedido ya no está en revisión.",
  INVALID_QUANTITY: "Las cantidades no pueden ser negativas.",
  REPARTO_REQUIRED: "Reparte lo recibido entre las tiendas antes de confirmar.",
  REPARTO_MISMATCH: "El reparto por tiendas debe sumar lo recibido.",
  NOTE_REQUIRED: "Escribe una nota de al menos 3 caracteres.",
  REASON_TEXT_REQUIRED: "Escribe el motivo (3 a 300 caracteres).",
  INVALID_LINES: "Indica un cambio distinto de cero.",
  LOT_NOT_IN_ORDER: "Ese lote no pertenece al pedido.",
};

export const reviewErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo completar la acción. Inténtalo de nuevo.";

const EVENT_TITLES: Record<OrderEventKind, string> = {
  created: "Pedido armado",
  assigned: "Comprador asignado",
  purchased: "Compra registrada",
  submitted: "Enviado a revisión",
  reviewed: "Revisión guardada",
  returned: "Devuelto a corrección",
  confirmed: "Cumplido",
  adjusted: "Ajuste",
};

export function timelineSteps(events: OrderEvent[], status: OrderStatus): TimelineStep[] {
  const steps: TimelineStep[] = events.map((e) => ({
    title: EVENT_TITLES[e.kind],
    state: e.kind === "returned" ? "returned" : e.kind === "confirmed" ? "confirmed" : "done",
    meta: e.at.slice(0, 10),
    note: e.note ?? undefined,
  }));
  if (status === "open" || status === "returned") steps.push({ title: "Compra", state: "now" });
  if (status === "in_review") steps.push({ title: "Revisión", state: "now" });
  return steps;
}

export type LotOption = { lotId: string; label: string; remaining: number };

export const adjustValid = (lot: LotOption | undefined, delta: number, reason: string) =>
  !!lot && Number.isFinite(delta) && delta !== 0 && lot.remaining + delta >= 0 && reason.trim().length >= 3;
