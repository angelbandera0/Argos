import { z } from "zod";
import { isValidIso } from "@/components/ui/datepicker-utils";
import type { OrderDest, OrderStatus, StorePart } from "@/core/domain/orders";
import type { BagGroup } from "@/components/requests/inbox-logic";

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "open", label: "Abierto · en curso" },
  { value: "in_review", label: "En revisión" },
  { value: "returned", label: "Devuelto" },
  { value: "fulfilled", label: "Cumplido" },
  { value: "draft", label: "Borrador" },
  { value: "cancelled", label: "Cancelado" },
];

const BADGE = { draft: "draft", open: "open", in_review: "review", returned: "returned", fulfilled: "done", cancelled: "cancelled" } as const;

export const orderBadge = (status: OrderStatus) => ({ family: "order" as const, status: BADGE[status] });

export const parseOrderStatus = (v: string | string[] | undefined): OrderStatus | undefined => ORDER_STATUS_OPTIONS.find((o) => o.value === v)?.value;

export const orderNumber = (id: string) => `#${id.slice(0, 6).toUpperCase()}`;

/** Valid ISO bounds in order; invalid values are dropped. */
export function parseDateRange(from: unknown, to: unknown): { from: string; to: string } {
  let f = typeof from === "string" && isValidIso(from) ? from : "";
  let t = typeof to === "string" && isValidIso(to) ? to : "";
  if (f && t && f > t) [f, t] = [t, f];
  return { from: f, to: t };
}

export const inRange = (createdAtDay: string, r: { from: string; to: string }) => (!r.from || createdAtDay >= r.from) && (!r.to || createdAtDay <= r.to);

export type DraftLine = {
  key: string;
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  mode: "general" | "stores";
  split: Record<string, number>;
};

const round = (n: number) => Number(n.toFixed(3));

export const splitSum = (l: DraftLine) => round(Object.values(l.split).reduce((s, v) => s + v, 0));

/** null when the line is ready; otherwise what is missing. */
export function lineIssue(l: DraftLine): string | null {
  if (!(l.qty > 0)) return "Indica una cantidad mayor que cero.";
  if (l.mode === "stores" && splitSum(l) !== round(l.qty)) return "El reparto por tiendas debe sumar la cantidad.";
  return null;
}

export const draftFromBag = (groups: BagGroup[], units: Record<string, string>): DraftLine[] =>
  groups.map((g) => ({
    key: `bag-${g.productId}`,
    productId: g.productId,
    productName: g.productName,
    unit: units[g.productId] ?? "",
    qty: g.total,
    mode: "stores",
    split: Object.fromEntries(g.stores.map((s) => [s.storeId, s.qtyBase])),
  }));

/** General: «direct» without split (required on confirm, M2-D10). One store: «store». Several: «direct» with plan. */
export function toWire(l: DraftLine): { productId: string; qty: number; parts: StorePart[] } {
  const parts = l.mode === "general" ? [] : Object.entries(l.split).filter(([, q]) => q > 0).map(([storeId, qty]) => ({ storeId, qty }));
  return { productId: l.productId, qty: l.qty, parts };
}

export function commandLine(w: { productId: string; qty: number; parts: StorePart[] }, unit: string) {
  const base = { productId: w.productId, qty: w.qty, unit, content: 1 };
  if (w.parts.length === 0) return { ...base, dest: "direct" as OrderDest };
  if (w.parts.length === 1) return { ...base, dest: "store" as OrderDest, storeId: w.parts[0].storeId };
  return { ...base, dest: "direct" as OrderDest, plan: w.parts };
}

export const breakdownByStore = (lines: DraftLine[]): { general: number; stores: Record<string, number> } => {
  const stores: Record<string, number> = {};
  let general = 0;
  for (const l of lines) {
    if (l.mode === "general") general += 1;
    else for (const [id, q] of Object.entries(l.split)) if (q > 0) stores[id] = round((stores[id] ?? 0) + q);
  }
  return { general, stores };
};

export const payloadSchema = z.object({
  buyerId: z.string(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().positive(),
        parts: z.array(z.object({ storeId: z.string().min(1), qty: z.number().positive() })),
      }),
    )
    .min(1),
});

const ERRORS: Record<string, string> = {
  EMPTY_ORDER: "Añade al menos una línea al pedido.",
  INVALID_QUANTITY: "Las cantidades deben ser mayores que cero.",
  PLAN_MISMATCH: "El reparto por tiendas debe sumar la cantidad de la línea.",
  BUYER_NOT_ELIGIBLE: "Esa persona no puede comprar: necesita el permiso de realizar compras.",
};

export const orderErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo crear el pedido. Inténtalo de nuevo.";
