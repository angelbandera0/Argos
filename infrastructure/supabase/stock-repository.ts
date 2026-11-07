import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Location,
  LotView,
  MovementUnitItem,
  Money,
  MovementView,
  PresentationItem,
  StockLine,
  StockRepository,
} from "@/core/application/ports/stock-repository";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { magnitudeOf, type StockStatus, type Unit } from "@/core/domain/stock";
import { stockError } from "./stock-errors";

type LocationRow = { id: string; company_id: string; kind: "warehouse" | "store"; store_id: string | null; name: string; active: boolean };
type StatusRow = {
  product_id: string;
  location_id: string;
  quantity: number | string;
  minimum: number | string | null;
  status: StockStatus;
  product_name: string | null;
  category_name: string | null;
};
const STATUS_COLS = "product_id, location_id, quantity, minimum, status, product_name, category_name";
type LotRow = {
  id: string;
  product_id: string;
  location_id: string;
  origin: string;
  source_lot_id: string | null;
  received_at: string;
  initial_qty: number | string;
  remaining: number | string;
  captured_qty: number | string;
  captured_unit: string;
  content: number | string;
};
type MovementRow = {
  id: string;
  type: string;
  qty_delta: number | string;
  captured_qty: number | string;
  captured_unit: string;
  reason_code: string | null;
  reason_text: string | null;
  document_type: string | null;
  document_id: string | null;
  reverses_id: string | null;
  actor_id: string | null;
  created_at: string;
  lot_id: string;
  product_id: string;
  location_id: string;
};
type CostRow = { unit_cost: number | string | null; currency_id: string | null };

const LOT_COLS = "id, product_id, location_id, origin, source_lot_id, received_at, initial_qty, remaining, captured_qty, captured_unit, content";
const MOVEMENT_COLS =
  "id, type, qty_delta, captured_qty, captured_unit, reason_code, reason_text, document_type, document_id, reverses_id, actor_id, created_at, lot_id, product_id, location_id";
const ITEM_COLS = { product_presentations: "id, name, content, active", product_movement_units: "id, name, equivalence, active" } as const;
const STATUSES: StockStatus[] = ["normal", "low", "out"];

const toLocation = (r: LocationRow): Location => ({
  id: r.id,
  companyId: r.company_id,
  kind: r.kind,
  storeId: r.store_id,
  name: r.name,
  active: r.active,
});

const money = (c: CostRow | undefined): Money | null | undefined =>
  !c ? undefined : c.unit_cost === null || c.currency_id === null ? null : { amount: Number(c.unit_cost), currencyId: c.currency_id };

export function makeStockRepository(supabase: SupabaseClient): StockRepository {
  async function costs(table: "lot_costs" | "movement_costs", key: "lot_id" | "movement_id", ids: string[]) {
    const map = new Map<string, CostRow>();
    if (!ids.length) return map;
    for (let i = 0; i < ids.length; i += 100) {
      const { data, error } = await supabase.from(table).select(`${key}, unit_cost, currency_id`).in(key, ids.slice(i, i + 100));
      if (error) stockError(`read ${table}`, error);
      for (const r of data as (CostRow & Record<string, string>)[]) map.set(r[key], r);
    }
    return map;
  }

  async function lotViews(rows: LotRow[]): Promise<LotView[]> {
    const c = await costs("lot_costs", "lot_id", rows.map((r) => r.id));
    return rows.map((r) => {
      const view: LotView = {
        id: r.id,
        productId: r.product_id,
        locationId: r.location_id,
        origin: r.origin,
        sourceLotId: r.source_lot_id,
        receivedAt: r.received_at,
        initialQty: Number(r.initial_qty),
        remaining: Number(r.remaining),
        capturedQty: Number(r.captured_qty),
        capturedUnit: r.captured_unit,
        content: Number(r.content),
      };
      const cost = money(c.get(r.id));
      if (cost !== undefined) view.unitCost = cost;
      return view;
    });
  }

  async function lines(rows: StatusRow[]): Promise<StockLine[]> {
    if (!rows.length) return [];
    const { data, error } = await supabase.from("product_stock_settings").select("product_id, base_unit").in("product_id", rows.map((r) => r.product_id));
    if (error) stockError("read settings", error);
    const units = new Map((data as { product_id: string; base_unit: Unit }[]).map((s) => [s.product_id, s.base_unit]));
    return rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name ?? "",
      categoryName: r.category_name,
      locationId: r.location_id,
      quantity: Number(r.quantity),
      minimum: r.minimum === null ? null : Number(r.minimum),
      status: r.status,
      baseUnit: units.get(r.product_id) ?? "lb",
    }));
  }

  async function companyOf(productId: string): Promise<string> {
    const { data, error } = await supabase.from("products").select("company_id").eq("id", productId).maybeSingle();
    if (error) stockError("read product", error);
    if (!data) throw new NotFound();
    return data.company_id as string;
  }

  type ItemTable = keyof typeof ITEM_COLS;
  const itemRepo = (table: ItemTable, field: "content" | "equivalence") => ({
    async add(productId: string, i: { name: string; content?: number; equivalence?: number }) {
      const { data, error } = await supabase
        .from(table)
        .insert({ company_id: await companyOf(productId), product_id: productId, name: i.name, [field]: i[field], active: true })
        .select(ITEM_COLS[table])
        .single();
      if (error) stockError(`add ${table}`, error);
      const r = data as unknown as { id: string; name: string; active: boolean } & Record<string, number | string>;
      return { id: r.id, name: r.name, [field]: Number(r[field]), active: r.active };
    },
    async patch(productId: string, id: string, patch: Record<string, unknown>) {
      if (!Object.keys(patch).length) return;
      const { data, error } = await supabase.from(table).update(patch).eq("product_id", productId).eq("id", id).is("deleted_at", null).select("id");
      if (error) stockError(`update ${table}`, error);
      if (!data?.length) throw new Forbidden();
    },
  });
  const presentations = itemRepo("product_presentations", "content");
  const movementUnits = itemRepo("product_movement_units", "equivalence");
  const defined = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
  const deletedNow = () => ({ deleted_at: new Date().toISOString() });

  async function ensureMinimum(productId: string, locationId: string, minimum: number) {
    const found = await supabase.from("stock_minimums").select("product_id").eq("product_id", productId).eq("location_id", locationId).maybeSingle();
    if (found.error) stockError("read minimum", found.error);
    const { error } = found.data
      ? await supabase.from("stock_minimums").update({ minimum }).eq("product_id", productId).eq("location_id", locationId)
      : await supabase
          .from("stock_minimums")
          .insert({ product_id: productId, location_id: locationId, company_id: await companyOf(productId), minimum });
    if (error) stockError("save minimum", error);
  }

  return {
    async listLocations(companyId) {
      const { data, error } = await supabase.from("locations").select("id, company_id, kind, store_id, name, active").eq("company_id", companyId).order("name").order("id");
      if (error) stockError("list locations", error);
      return (data as LocationRow[]).map(toLocation);
    },

    async getLocation(id) {
      const { data, error } = await supabase.from("locations").select("id, company_id, kind, store_id, name, active").eq("id", id).maybeSingle();
      if (error) stockError("get location", error);
      return data ? toLocation(data as LocationRow) : null;
    },

    async getProductCompany(productId) {
      const own = await supabase.from("product_stock_settings").select("company_id").eq("product_id", productId).maybeSingle();
      if (own.error) stockError("read settings", own.error);
      if (own.data) return own.data.company_id as string;
      const { data, error } = await supabase.from("products").select("company_id").eq("id", productId).is("deleted_at", null).maybeSingle();
      if (error) stockError("read product", error);
      return (data?.company_id as string | undefined) ?? null;
    },

    async listStatus(f, page) {
      let q = supabase.from("stock_status").select(STATUS_COLS, { count: "exact" }).eq("company_id", f.companyId).eq("location_id", f.locationId);
      if (f.status) q = q.eq("status", f.status);
      if (f.q) q = q.ilike("product_name", `%${f.q.replace(/[\\%_]/g, "\\$&")}%`);
      if (f.categoryId) q = q.eq("category_id", f.categoryId);
      const { data, error, count } = await q.order("product_name").order("product_id").range(page.offset, page.offset + page.limit - 1);
      if (error) stockError("list stock status", error);
      return { items: await lines(data as unknown as StatusRow[]), total: count ?? 0 };
    },

    async countByStatus(companyId, locationId) {
      const counts = await Promise.all(
        STATUSES.map(async (s) => {
          const { count, error } = await supabase
            .from("stock_status")
            .select("product_id", { count: "exact", head: true })
            .eq("company_id", companyId)
            .eq("location_id", locationId)
            .eq("status", s);
          if (error) stockError("count stock status", error);
          return [s, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(counts) as Record<StockStatus, number>;
    },

    async getStockLine(productId, locationId) {
      const { data, error } = await supabase.from("stock_status").select(STATUS_COLS).eq("product_id", productId).eq("location_id", locationId).maybeSingle();
      if (error) stockError("get stock line", error);
      return data ? (await lines([data as unknown as StatusRow]))[0] : null;
    },

    async getProductConfig(productId) {
      const { data, error } = await supabase.from("product_stock_settings").select("storable, base_unit").eq("product_id", productId).maybeSingle();
      if (error) stockError("get product config", error);
      if (!data && !(await this.getProductCompany(productId))) return null;
      const baseUnit = (data?.base_unit ?? "lb") as Unit;
      const [pres, units, lots] = await Promise.all([
        supabase.from("product_presentations").select(ITEM_COLS.product_presentations).eq("product_id", productId).is("deleted_at", null).order("name").order("id"),
        supabase.from("product_movement_units").select(ITEM_COLS.product_movement_units).eq("product_id", productId).is("deleted_at", null).order("name").order("id"),
        supabase.from("lots").select("id", { count: "exact", head: true }).eq("product_id", productId),
      ]);
      if (lots.error) stockError("count lots", lots.error);
      if (pres.error) stockError("list presentations", pres.error);
      if (units.error) stockError("list movement units", units.error);
      return {
        productId,
        storable: data?.storable ?? false,
        baseUnit,
        magnitude: magnitudeOf(baseUnit),
        baseUnitLocked: (lots.count ?? 0) > 0,
        presentations: (pres.data as unknown as PresentationItem[]).map((p) => ({ ...p, content: Number(p.content) })),
        movementUnits: (units.data as unknown as MovementUnitItem[]).map((u) => ({ ...u, equivalence: Number(u.equivalence) })),
      };
    },

    async saveProductConfig(productId, config) {
      const found = await supabase.from("product_stock_settings").select("product_id").eq("product_id", productId).maybeSingle();
      if (found.error) stockError("read settings", found.error);
      const { error } = found.data
        ? await supabase.from("product_stock_settings").update({ storable: config.storable, base_unit: config.baseUnit }).eq("product_id", productId)
        : await supabase
            .from("product_stock_settings")
            .insert({ product_id: productId, company_id: await companyOf(productId), storable: config.storable, base_unit: config.baseUnit });
      if (error) stockError("save product config", error);
    },

    addPresentation: (productId, i) => presentations.add(productId, i) as unknown as Promise<PresentationItem>,
    updatePresentation: (productId, id, c) => presentations.patch(productId, id, defined({ name: c.name, content: c.content })),
    setPresentationActive: (productId, id, active) => presentations.patch(productId, id, { active }),
    deletePresentation: (productId, id) => presentations.patch(productId, id, deletedNow()),
    addMovementUnit: (productId, i) => movementUnits.add(productId, i) as unknown as Promise<MovementUnitItem>,
    updateMovementUnit: (productId, id, c) => movementUnits.patch(productId, id, defined({ name: c.name, equivalence: c.equivalence })),
    setMovementUnitActive: (productId, id, active) => movementUnits.patch(productId, id, { active }),
    deleteMovementUnit: (productId, id) => movementUnits.patch(productId, id, deletedNow()),

    setMinimum: ensureMinimum,
    // authenticated has no delete on stock_minimums: a minimum of 0 behaves as "none" for status (qty <= 0 is already 'out').
    clearMinimum: async (productId, locationId) => {
      const { error } = await supabase.from("stock_minimums").update({ minimum: 0 }).eq("product_id", productId).eq("location_id", locationId);
      if (error) stockError("clear minimum", error);
    },

    async getLot(id) {
      const { data, error } = await supabase.from("lots").select(LOT_COLS).eq("id", id).maybeSingle();
      if (error) stockError("get lot", error);
      return data ? (await lotViews([data as LotRow]))[0] : null;
    },

    async listLotCostAdjustments(lotId) {
      const { data, error } = await supabase
        .from("lot_cost_adjustments")
        .select("id, lot_id, order_id, old_unit_cost, new_unit_cost, currency_id, reason, created_by, created_at")
        .eq("lot_id", lotId)
        .order("created_at", { ascending: false });
      if (error) stockError("list lot cost adjustments", error);
      return (data ?? []).map((r) => ({
        id: r.id,
        lotId: r.lot_id,
        orderId: r.order_id,
        oldUnitCost: r.old_unit_cost === null ? null : Number(r.old_unit_cost),
        newUnitCost: Number(r.new_unit_cost),
        currencyId: r.currency_id,
        reason: r.reason,
        createdBy: r.created_by,
        createdAt: r.created_at,
      }));
    },

    async listLots(productId, locationId, filter) {
      let q = supabase.from("lots").select(LOT_COLS).eq("product_id", productId).eq("location_id", locationId);
      if (filter.onlyAvailable) q = q.gt("remaining", 0);
      const { data, error } = await q.order("received_at").order("created_at").order("id");
      if (error) stockError("list lots", error);
      return lotViews(data as LotRow[]);
    },

    async listLocationLots(locationId) {
      const { data, error } = await supabase.from("lots").select(LOT_COLS).eq("location_id", locationId).gt("remaining", 0).limit(5000);
      if (error) stockError("list location lots", error);
      return lotViews(data as LotRow[]);
    },

    async listMovements(f, page) {
      if (!f.locationIds.length) return { items: [], total: 0 };
      let q = supabase.from("stock_movements").select(MOVEMENT_COLS, { count: "exact" }).eq("company_id", f.companyId).in("location_id", f.locationIds);
      if (f.productId) q = q.eq("product_id", f.productId);
      if (f.locationId) q = q.eq("location_id", f.locationId);
      if (f.type) q = q.eq("type", f.type);
      if (f.from) q = q.gte("created_at", f.from.toISOString());
      if (f.to) q = q.lte("created_at", f.to.toISOString());
      const { data, error, count } = await q.order("created_at", { ascending: false }).order("id", { ascending: false }).range(page.offset, page.offset + page.limit - 1);
      if (error) stockError("list movements", error);
      const rows = data as MovementRow[];
      const c = await costs("movement_costs", "movement_id", rows.map((r) => r.id));
      const items = rows.map((r): MovementView => {
        const view: MovementView = {
          id: r.id,
          type: r.type,
          qtyDelta: Number(r.qty_delta),
          capturedQty: Number(r.captured_qty),
          capturedUnit: r.captured_unit,
          reasonCode: r.reason_code,
          reasonText: r.reason_text,
          documentType: r.document_type,
          documentId: r.document_id,
          reversesId: r.reverses_id,
          actorId: r.actor_id,
          createdAt: r.created_at,
          lotId: r.lot_id,
          productId: r.product_id,
          locationId: r.location_id,
        };
        const cost = money(c.get(r.id));
        if (cost !== undefined) view.unitCost = cost;
        return view;
      });
      return { items, total: count ?? 0 };
    },
  };
}
