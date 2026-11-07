import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RequestDetail, RequestLine, RequestRepository, RequestSummary } from "@/core/application/ports/request-repository";
import { translateRequestError } from "@/core/domain/errors";
import type { AssignmentKind, RequestStatus } from "@/core/domain/requests";
import { replenishmentError } from "./replenishment-errors";

type Err = { code?: string; message?: string } | null;
type RequestRow = { id: string; company_id: string; store_id: string; note: string | null; created_at: string };
type LineRow = { id: string; request_id: string; product_id: string; qty: number | string; unit: string; qty_base: number | string };
type AssignmentRow = { id: string; line_id: string; kind: AssignmentKind; qty_base: number | string; reason: string | null; decided_by: string | null; decided_at: string };

const REQUEST_COLS = "id, company_id, store_id, note, created_at";
const picksOf = (picks?: { lotId: string; qty: number }[]) => (picks ? picks.map((p) => ({ lot_id: p.lotId, qty: p.qty })) : null);

export function makeRequestRepository(supabase: SupabaseClient): RequestRepository {
  const fail = (op: string, error: Err): void => {
    if (error) replenishmentError(op, error, translateRequestError);
  };

  async function names(table: "stores" | "products", ids: string[]) {
    const map = new Map<string, string>();
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await supabase.from(table).select("id, name").in("id", ids.slice(i, i + 100));
      fail(`read ${table}`, error);
      for (const r of data as { id: string; name: string }[]) map.set(r.id, r.name);
    }
    return map;
  }

  async function statuses(ids: string[]) {
    const map = new Map<string, RequestStatus>();
    if (!ids.length) return map;
    const { data, error } = await supabase.from("solicitud_estado").select("request_id, status").in("request_id", ids);
    fail("read request status", error);
    for (const r of data as { request_id: string; status: RequestStatus }[]) map.set(r.request_id, r.status);
    return map;
  }

  async function summaries(rows: RequestRow[]): Promise<RequestSummary[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [stores, status, lines] = await Promise.all([
      names("stores", [...new Set(rows.map((r) => r.store_id))]),
      statuses(ids),
      supabase.from("solicitud_lineas").select("request_id").in("request_id", ids),
    ]);
    fail("read request lines", lines.error);
    const counts = new Map<string, number>();
    for (const l of lines.data as { request_id: string }[]) counts.set(l.request_id, (counts.get(l.request_id) ?? 0) + 1);
    return rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      storeId: r.store_id,
      storeName: stores.get(r.store_id) ?? "",
      status: status.get(r.id) ?? "new",
      lineCount: counts.get(r.id) ?? 0,
      createdAt: r.created_at,
    }));
  }

  async function detail(row: RequestRow): Promise<RequestDetail> {
    const { data: lineData, error } = await supabase.from("solicitud_lineas").select("id, request_id, product_id, qty, unit, qty_base").eq("request_id", row.id).order("id");
    fail("read request lines", error);
    const lineRows = lineData as LineRow[];
    const lineIds = lineRows.map((l) => l.id);
    const [summary] = await summaries([row]);
    const [products, asg] = await Promise.all([
      names("products", [...new Set(lineRows.map((l) => l.product_id))]),
      lineIds.length
        ? supabase.from("solicitud_asignaciones").select("id, line_id, kind, qty_base, reason, decided_by, decided_at").in("line_id", lineIds).order("decided_at").order("id")
        : Promise.resolve({ data: [], error: null }),
    ]);
    fail("read assignments", asg.error);
    const lines: RequestLine[] = lineRows.map((l) => ({
      id: l.id,
      productId: l.product_id,
      productName: products.get(l.product_id) ?? "",
      qty: Number(l.qty),
      unit: l.unit,
      qtyBase: Number(l.qty_base),
      assignments: (asg.data as AssignmentRow[])
        .filter((a) => a.line_id === l.id)
        .map((a) => ({ id: a.id, kind: a.kind, qtyBase: Number(a.qty_base), reason: a.reason, decidedBy: a.decided_by, decidedAt: a.decided_at })),
    }));
    return { ...summary, note: row.note, lines };
  }

  return {
    async create(cmd) {
      const { data, error } = await supabase.rpc("create_request", {
        p_store: cmd.storeId,
        p_lines: cmd.lines.map((l) => ({ product_id: l.productId, qty: l.qty, unit: l.unit })),
        p_note: cmd.note ?? null,
      });
      fail("create_request", error);
      return data as string;
    },

    async attendLine(cmd) {
      const { data, error } = await supabase.rpc("attend_request_line", {
        p_line: cmd.lineId,
        p_kind: cmd.kind,
        p_qty_base: cmd.qtyBase,
        p_reason: cmd.reason ?? null,
        p_picks: picksOf(cmd.picks),
        p_deviation_reason: cmd.deviationReason ?? null,
      });
      fail("attend_request_line", error);
      return data as string;
    },

    async list(companyId, filters, page) {
      let ids: string[] | undefined;
      if (filters.status) {
        let e = supabase.from("solicitud_estado").select("request_id").eq("company_id", companyId).eq("status", filters.status);
        if (filters.storeId) e = e.eq("store_id", filters.storeId);
        const { data, error } = await e;
        fail("read request status", error);
        ids = (data as { request_id: string }[]).map((r) => r.request_id);
        if (!ids.length) return { items: [], total: 0 };
      }
      let q = supabase.from("solicitudes").select(REQUEST_COLS, { count: "exact" }).eq("company_id", companyId);
      if (filters.storeId) q = q.eq("store_id", filters.storeId);
      if (ids) q = q.in("id", ids);
      const { data, error, count } = await q.order("created_at", { ascending: false }).order("id").range(page.offset, page.offset + page.limit - 1);
      fail("list requests", error);
      return { items: await summaries(data as RequestRow[]), total: count ?? 0 };
    },

    async get(requestId) {
      const { data, error } = await supabase.from("solicitudes").select(REQUEST_COLS).eq("id", requestId).maybeSingle();
      fail("get request", error);
      return data ? detail(data as RequestRow) : null;
    },

    async getByLine(lineId) {
      const { data, error } = await supabase.from("solicitud_lineas").select("request_id").eq("id", lineId).maybeSingle();
      fail("get request line", error);
      return data ? this.get((data as { request_id: string }).request_id) : null;
    },

    async listPurchaseBag(companyId) {
      const { data, error } = await supabase.from("bolsa_por_comprar").select("product_id, store_id, qty_base, decisions").eq("company_id", companyId);
      fail("read purchase bag", error);
      const rows = data as { product_id: string; store_id: string; qty_base: number | string; decisions: number }[];
      const [products, stores] = await Promise.all([
        names("products", [...new Set(rows.map((r) => r.product_id))]),
        names("stores", [...new Set(rows.map((r) => r.store_id))]),
      ]);
      return rows
        .map((r) => ({
          productId: r.product_id,
          productName: products.get(r.product_id) ?? "",
          storeId: r.store_id,
          storeName: stores.get(r.store_id) ?? "",
          qtyBase: Number(r.qty_base),
          decisions: r.decisions,
        }))
        .sort((a, b) => a.productName.localeCompare(b.productName) || a.storeName.localeCompare(b.storeName));
    },
  };
}
