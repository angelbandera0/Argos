import { describe, expect, it } from "vitest";
import { averageCost, formatStockQty, lotsValue, minimumLabel, parseStatus, stockListQuery, sumByCurrency, unknownCostLabel } from "@/components/stock/stock-list-logic";

const lot = (remaining: number, unitCost?: { amount: number; currencyId: string } | null) => ({ remaining, unitCost });

describe("stock list logic", () => {
  it("round-trips filters through the URL", () => {
    expect(stockListQuery({ ubicacion: "l1", q: "arroz", estado: "low", pagina: 2 })).toBe("?ubicacion=l1&q=arroz&estado=bajo&pagina=2");
    expect(stockListQuery({ estado: "todos", pagina: 1 })).toBe("");
    expect(parseStatus("bajo")).toBe("low");
    expect(parseStatus("x")).toBe("todos");
  });
  it("formats quantities and minimums", () => {
    expect(formatStockQty(1234.5, "lb")).toBe("1.234,500 lb");
    expect(formatStockQty(12, "u")).toBe("12 u");
    expect(formatStockQty(2, "l")).toBe("2,000 L");
    expect(minimumLabel(0, "lb")).toBe("Sin mínimo");
    expect(minimumLabel(null, "lb")).toBe("Sin mínimo");
    expect(minimumLabel(5, "lb")).toBe("5,000 lb");
  });
  it("values lots leaving unknown costs aside", () => {
    const v = lotsValue([lot(10, { amount: 2, currencyId: "c" }), lot(10, { amount: 4, currencyId: "c" }), lot(5, null), lot(3)]);
    expect(v.byCurrency).toEqual([{ currencyId: "c", value: 60, qty: 20 }]);
    expect(v.unknownQty).toBe(8);
    expect(averageCost(v)).toEqual({ currencyId: "c", amount: 3 });
    expect(averageCost(lotsValue([lot(5, null)]))).toBeNull();
    expect(sumByCurrency([{ currencyId: "c", value: 1 }, { currencyId: "c", value: 2 }])).toEqual([{ currencyId: "c", amount: 3 }]);
    expect(unknownCostLabel(0)).toBeNull();
    expect(unknownCostLabel(1)).toBe("1 producto sin costo conocido");
  });
});
