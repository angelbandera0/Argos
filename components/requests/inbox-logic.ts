import { z } from "zod";
import { picksField } from "@/components/stock/transfer-logic";
import { ASSIGNMENT_KINDS, type AssignmentKind, type RequestStatus } from "@/core/domain/requests";

export const STATUS_OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "new", label: "Sin atender" },
  { value: "in_progress", label: "Parcial" },
  { value: "to_buy", label: "Por comprar" },
  { value: "pending", label: "Pendiente" },
  { value: "fulfilled", label: "Cumplida" },
  { value: "rejected", label: "Rechazada" },
];

export function parseInboxStatus(v: string | string[] | undefined): RequestStatus | undefined {
  return STATUS_OPTIONS.find((o) => o.value === v)?.value;
}

export const KIND_OPTIONS: { value: AssignmentKind; label: string }[] = [
  { value: "fulfilled", label: "Trasladar" },
  { value: "to_buy", label: "Mandar a por comprar" },
  { value: "pending", label: "Dejar pendiente" },
  { value: "rejected", label: "Rechazar" },
];

const amount = z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number().finite().positive());

export const attendSchema = z.object({
  lineId: z.string().min(1),
  kind: z.enum(ASSIGNMENT_KINDS as [AssignmentKind, ...AssignmentKind[]]),
  qty: amount,
  reason: z.string().max(500),
  picks: picksField,
  deviation: z.string().trim().max(300).optional(),
});

/** Most that can be moved to a store now: the undecided part, capped by what the warehouse has. */
export const maxTransfer = (remaining: number, warehouse: number) => Math.max(0, Math.min(remaining, warehouse));

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Revisa la decisión y la cantidad: debe ser mayor que cero.",
  INVALID_QUANTITY: "La cantidad debe ser mayor que cero.",
  ASSIGNMENT_EXCEEDS_LINE: "La cantidad supera lo que falta por decidir en esta línea.",
  REASON_REQUIRED: "Escribe el motivo del rechazo.",
  LOT_EXCEEDED: "Un lote no tiene tanta cantidad disponible.",
  QUANTITY_MISMATCH: "Los lotes elegidos deben sumar la cantidad a trasladar.",
  CHOOSE_LOT_FORBIDDEN: "No tienes permiso para elegir lotes distintos al más antiguo.",
  INSUFFICIENT_STOCK: "El almacén no tiene suficiente existencia para trasladar eso.",
};

export const attendErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo guardar la decisión. Inténtalo de nuevo.";

export type BagGroup = { productId: string; productName: string; total: number; stores: { storeId: string; storeName: string; qtyBase: number }[] };

export function groupBag(rows: { productId: string; productName: string; storeId: string; storeName: string; qtyBase: number }[]): BagGroup[] {
  const map = new Map<string, BagGroup>();
  for (const r of rows) {
    const g = map.get(r.productId) ?? { productId: r.productId, productName: r.productName, total: 0, stores: [] };
    g.total = Math.round((g.total + r.qtyBase) * 1000) / 1000;
    g.stores.push({ storeId: r.storeId, storeName: r.storeName, qtyBase: r.qtyBase });
    map.set(r.productId, g);
  }
  return [...map.values()].sort((a, b) => a.productName.localeCompare(b.productName, "es"));
}
