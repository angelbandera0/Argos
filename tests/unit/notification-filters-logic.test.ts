import { describe, expect, it } from "vitest";
import { groupByDay } from "@/components/history/time-zone";
import { hasActiveFilters, notificationsQuery, parseNotificationParams, toListInput } from "@/components/notifications/notification-filters-logic";

describe("notification-filters-logic", () => {
  it("parsea y descarta valores inválidos", () => {
    const f = parseNotificationParams({ modulo: "orders", prioridad: "x", estado: "sin-leer", desde: "2026-11-09", hasta: "2026-11-01", pagina: "0", tienda: "no" });
    expect(f).toMatchObject({ module: "orders", priority: undefined, read: "unread", from: "2026-11-01", to: "2026-11-09", page: 1, storeId: undefined });
  });

  it("ida y vuelta con la URL", () => {
    const f = parseNotificationParams({ modulo: "stock", operacion: "create", estado: "leidas", pagina: "3" });
    expect(parseNotificationParams(Object.fromEntries(new URLSearchParams(notificationsQuery(f))))).toEqual(f);
    expect(notificationsQuery(parseNotificationParams({}))).toBe("");
    expect(hasActiveFilters(f)).toBe(true);
    expect(hasActiveFilters(parseNotificationParams({ pagina: "2" }))).toBe(false);
  });

  it("corta el rango de fechas en la zona del usuario", () => {
    const input = toListInput(parseNotificationParams({ desde: "2026-11-06", hasta: "2026-11-06" }), "America/Havana");
    expect(input.from).toBe("2026-11-06T05:00:00.000Z");
    expect(input.to).toBe("2026-11-07T04:59:59.999Z");
    expect(input.pageSize).toBe(20);
  });

  it("agrupa por día local", () => {
    const rows = [{ createdAt: "2026-11-07T03:00:00Z" }, { createdAt: "2026-11-06T20:00:00Z" }, { createdAt: "2026-11-05T20:00:00Z" }];
    const groups = groupByDay(rows, "America/Havana", new Date("2026-11-06T18:00:00Z"));
    expect(groups.map((g) => [g.key, g.rows.length])).toEqual([["2026-11-06", 2], ["2026-11-05", 1]]);
    expect(groups[0].label).toMatch(/^Hoy/);
  });
});
