import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrderDetail, OrderEvent, OrderLine, OrderRepository, OrderSummary } from "@/core/application/ports/order-repository";
import { translateOrderError } from "@/core/domain/errors";
import type { OrderDest, OrderStatus, StorePart } from "@/core/domain/orders";
import { replenishmentError } from "./replenishment-errors";

type Err = { code?: string; message?: string } | null;
type OrderRow = {
  id: string;
  company_id: string;
  status: OrderStatus;
  buyer_id: string | null;
  currency_id: string | null;
  note: string | null;
  return_note: string | null;
  created_at: string;
};
type LineRow = {
  id: string;
  product_id: string;
  dest: OrderDest;
  dest_store_id: string | null;
  qty: number | string;
  unit: string;
  content: number | string;
  qty_bought: number | string | null;
  qty_received: number | string | null;
};

const ORDER_COLS = "id, company_id, status, buyer_id, currency_id, note, return_note, created_at";
const LINE_COLS = "id, product_id, dest, dest_store_id, qty, unit, content, qty_bought, qty_received";
const num = (v: number | string | null | undefined) => (v === null || v === undefined ? null : Number(v));

export function makeOrderRepository(supabase: SupabaseClient): OrderRepository {
  const fail = (op: string, error: Err): void => {
    if (error) replenishmentError(op, error, translateOrderError);
  };
  async function rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    fail(fn, error);
    return data as T;
  }

  async function summaries(rows: OrderRow[]): Promise<OrderSummary[]> {
    if (!rows.length) return [];
    const { data, error } = await supabase.from("pedido_lineas").select("order_id").in("order_id", rows.map((r) => r.id));
    fail("read order lines", error);
    const counts = new Map<string, number>();
    for (const l of data as { order_id: string }[]) counts.set(l.order_id, (counts.get(l.order_id) ?? 0) + 1);
    return rows.map((r) => ({ id: r.id, companyId: r.company_id, status: r.status, buyerId: r.buyer_id, lineCount: counts.get(r.id) ?? 0, createdAt: r.created_at }));
  }

  return {
    create: (cmd) =>
      rpc<string>("create_pedido", {
        p_lines: cmd.lines.map((l) => ({
          product_id: l.productId,
          dest: l.dest,
          store_id: l.storeId ?? null,
          qty: l.qty,
          unit: l.unit,
          content: l.content,
          assignment_id: l.assignmentId ?? null,
          plan: (l.plan ?? []).map((p) => ({ store_id: p.storeId, qty: p.qty })),
        })),
        p_currency: cmd.currencyId ?? null,
        p_note: cmd.note ?? null,
      }),

    async assignBuyer(orderId, buyerId) {
      await rpc("assign_pedido_buyer", { p_order: orderId, p_buyer: buyerId });
    },

    async isEligibleBuyer(companyId, userId) {
      return (await rpc<boolean>("is_eligible_buyer", { p_company: companyId, p_user: userId })) === true;
    },

    async registerPurchase(cmd) {
      await rpc("register_pedido_purchase", {
        p_order: cmd.orderId,
        p_lines: cmd.lines.map((l) => ({ line_id: l.lineId, qty_bought: l.qtyBought, unit_cost: l.unitCost })),
        p_amount_given: cmd.amountGiven ?? null,
      });
    },

    async submitReview(orderId) {
      const r = await rpc<{ given: number | string | null; spent: number | string; leftover: number | string | null }>("submit_pedido_review", { p_order: orderId });
      return { given: num(r.given), spent: Number(r.spent), leftover: num(r.leftover) };
    },

    async saveReview(orderId, lines) {
      await rpc("save_pedido_review", { p_order: orderId, p_lines: lines.map((l) => ({ line_id: l.lineId, qty_received: l.qtyReceived })) });
    },

    async confirm(orderId, lines) {
      await rpc("confirmar_pedido", {
        p_order: orderId,
        p_lines: lines.map((l) => ({
          line_id: l.lineId,
          ...(l.qtyReceived !== undefined && { qty_received: l.qtyReceived }),
          ...(l.reparto && { reparto: l.reparto.map((p) => ({ store_id: p.storeId, qty: p.qty })) }),
        })),
      });
    },

    async returnOrder(orderId, note) {
      await rpc("devolver_pedido", { p_order: orderId, p_note: note });
    },

    adjust: (orderId, reason, lines) =>
      rpc<string>("adjust_pedido", { p_order: orderId, p_reason: reason, p_lines: lines.map((l) => ({ lot_id: l.lotId, delta: l.delta })) }),

    async list(companyId, filters, page) {
      let q = supabase.from("pedidos").select(ORDER_COLS, { count: "exact" }).eq("company_id", companyId);
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.buyerId) q = q.eq("buyer_id", filters.buyerId);
      if (filters.createdFrom) q = q.gte("created_at", filters.createdFrom);
      if (filters.createdTo) q = q.lt("created_at", filters.createdTo);
      const { data, error, count } = await q.order("created_at", { ascending: false }).order("id").range(page.offset, page.offset + page.limit - 1);
      fail("list orders", error);
      return { items: await summaries(data as OrderRow[]), total: count ?? 0 };
    },

    async listEvents(orderId) {
      const { data, error } = await supabase.from("pedido_eventos").select("kind, actor, at, nota").eq("order_id", orderId).order("at").order("id");
      fail("read order events", error);
      return (data as { kind: OrderEvent["kind"]; actor: string | null; at: string; nota: string | null }[]).map((e) => ({ kind: e.kind, actor: e.actor, at: e.at, note: e.nota }));
    },

    async get(orderId) {
      const { data, error } = await supabase.from("pedidos").select(ORDER_COLS).eq("id", orderId).maybeSingle();
      fail("get order", error);
      if (!data) return null;
      const row = data as OrderRow;
      const { data: lineData, error: lineError } = await supabase.from("pedido_lineas").select(LINE_COLS).eq("order_id", row.id).order("id");
      fail("read order lines", lineError);
      const lineRows = lineData as LineRow[];
      const ids = lineRows.map((l) => l.id);
      const [products, plans, lineCosts, orderCosts, [summary]] = await Promise.all([
        supabase.from("products").select("id, name").in("id", [...new Set(lineRows.map((l) => l.product_id))]),
        ids.length ? supabase.from("pedido_linea_tiendas").select("line_id, store_id, qty").eq("kind", "plan").in("line_id", ids) : { data: [], error: null },
        ids.length ? supabase.from("pedido_linea_costos").select("line_id, unit_cost, shortage_value").in("line_id", ids) : { data: [], error: null },
        supabase.from("pedido_costos").select("amount_given, spent, leftover, shortage_value").eq("order_id", row.id).maybeSingle(),
        summaries([row]),
      ]);
      for (const r of [products, plans, lineCosts, orderCosts]) fail("read order", r.error);
      const names = new Map((products.data as { id: string; name: string }[]).map((p) => [p.id, p.name]));
      const cost = new Map((lineCosts.data as { line_id: string; unit_cost: number | string; shortage_value: number | string | null }[]).map((c) => [c.line_id, c]));
      const planOf = (id: string): StorePart[] =>
        (plans.data as { line_id: string; store_id: string; qty: number | string }[]).filter((p) => p.line_id === id).map((p) => ({ storeId: p.store_id, qty: Number(p.qty) }));
      const lines: OrderLine[] = lineRows.map((l) => ({
        id: l.id,
        productId: l.product_id,
        productName: names.get(l.product_id) ?? "",
        dest: l.dest,
        destStoreId: l.dest_store_id,
        qty: Number(l.qty),
        unit: l.unit,
        content: Number(l.content),
        qtyBought: num(l.qty_bought),
        qtyReceived: num(l.qty_received),
        plan: planOf(l.id),
        unitCost: num(cost.get(l.id)?.unit_cost),
        shortageValue: num(cost.get(l.id)?.shortage_value),
      }));
      const oc = orderCosts.data as { amount_given: number | string | null; spent: number | string | null; leftover: number | string | null; shortage_value: number | string | null } | null;
      const detail: OrderDetail = {
        ...summary,
        currencyId: row.currency_id,
        note: row.note,
        returnNote: row.return_note,
        lines,
        amountGiven: num(oc?.amount_given),
        spent: num(oc?.spent),
        leftover: num(oc?.leftover),
        shortageValue: num(oc?.shortage_value),
      };
      return detail;
    },
  };
}
