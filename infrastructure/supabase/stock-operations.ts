import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StockOperations } from "@/core/application/ports/stock-operations";
import { stockError } from "./stock-errors";

const picksOf = (picks?: { lotId: string; qty: number }[]) => (picks ? picks.map((p) => ({ lot_id: p.lotId, qty: p.qty })) : null);

export function makeStockOperations(supabase: SupabaseClient): StockOperations {
  async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) stockError(fn, error);
    return data as T;
  }
  const entry = (fn: string) => (c: Parameters<StockOperations["registerInitialEntry"]>[0]) =>
    call<string>(fn, {
      p_product: c.productId,
      p_location: c.locationId,
      p_qty: c.qty,
      p_unit: c.unit,
      p_content: c.content,
      p_unit_cost: c.unitCost ?? null,
      p_currency: c.currencyId ?? null,
      p_received: c.receivedAt,
    });

  return {
    registerInitialEntry: entry("register_initial_entry"),
    registerDirectEntry: entry("register_direct_entry"),
    async transfer(c) {
      const r = await call<{ moved_base: number; moved_unit_qty: number; lots: { source_lot: string; dest_lot: string; qty: number }[] }>(
        "register_transfer",
        {
          p_product: c.productId,
          p_from: c.fromLocationId,
          p_to: c.toLocationId,
          p_qty: c.qty,
          p_unit: c.unit,
          p_picks: picksOf(c.picks),
          p_deviation_reason: c.deviationReason ?? null,
        },
      );
      return {
        movedBase: Number(r.moved_base),
        movedUnitQty: Number(r.moved_unit_qty),
        lots: r.lots.map((l) => ({ sourceLot: l.source_lot, destLot: l.dest_lot, qty: Number(l.qty) })),
      };
    },
    async writeOff(c) {
      const r = await call<{ removed_base: number; lots: { lot_id: string; qty: number; movement_id: string }[] }>("register_write_off", {
        p_product: c.productId,
        p_location: c.locationId,
        p_qty: c.qty,
        p_unit: c.unit,
        p_reason: c.reasonId,
        p_reason_text: c.reasonText ?? null,
        p_picks: picksOf(c.picks),
        p_deviation_reason: c.deviationReason ?? null,
      });
      return {
        removedBase: Number(r.removed_base),
        lots: r.lots.map((l) => ({ lotId: l.lot_id, qty: Number(l.qty), movementId: l.movement_id })),
      };
    },
    adjust: (c) => call<string>("register_adjustment", { p_lot: c.lotId, p_delta: c.delta, p_reason_text: c.reasonText }),
    registerSurplus: (c) =>
      call<string>("register_surplus", {
        p_product: c.productId,
        p_location: c.locationId,
        p_qty: c.qty,
        p_reason_text: c.reasonText,
        p_unit_cost: c.unitCost ?? null,
        p_currency: c.currencyId ?? null,
      }),
  };
}
