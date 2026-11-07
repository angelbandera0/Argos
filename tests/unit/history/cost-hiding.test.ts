import { describe, expect, it } from "vitest";
import { operationInfo, HISTORY_MODULES } from "@/components/history/history-utils";
import { sanitizeEntry } from "@/core/application/use-cases/history/sanitize";
import type { HistoryEntry } from "@/core/application/ports/history-reader";

const entry = {
  id: "1", module: "orders", entityType: "pedidos", entityId: "x", action: "update", actorId: null, storeId: null,
  channel: "ui", createdAt: new Date(),
  before: { status: "open", amount_given: 10 },
  after: { status: "fulfilled", amount_given: 12, shortage_value: 2, unit_cost: 1.5, qty: 3, pin: "1" },
} as HistoryEntry;

describe("history cost hiding", () => {
  it("hides monetary keys without see_costs", () => {
    expect(sanitizeEntry(entry).after).toEqual({ status: "fulfilled", qty: 3 });
    expect(sanitizeEntry(entry).before).toEqual({ status: "open" });
  });
  it("keeps them with see_costs but never pins", () => {
    expect(sanitizeEntry(entry, true).after).toEqual({ status: "fulfilled", amount_given: 12, shortage_value: 2, unit_cost: 1.5, qty: 3 });
  });
  it("labels module 2 modules and operations", () => {
    expect(HISTORY_MODULES.stock).toBe("Existencias");
    expect(operationInfo("create", "stock_movements", null, { type: "write_off" }).label).toBe("Baja");
    expect(operationInfo("update", "pedidos", entry.before, entry.after).label).toBe("Confirmación");
    expect(operationInfo("create", "pedido_ajustes", null, {}).label).toBe("Corrección");
    expect(operationInfo("update", "products", {}, {}).label).toBe("Edición");
  });
});
