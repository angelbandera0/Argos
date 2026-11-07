import { describe, expect, it } from "vitest";
import { detailQuery, lotOriginLabel, movementTypeLabel, parseIsoDate, parseMovementType, parseTab, signedQty } from "@/components/stock/product-detail-logic";

describe("product-detail-logic", () => {
  it("parses params defensively", () => {
    expect(parseMovementType("write_off")).toBe("write_off");
    expect(parseMovementType("x")).toBe("");
    expect(parseIsoDate("2026-11-07")).toBe("2026-11-07");
    expect(parseIsoDate("07/11/2026")).toBe("");
    expect(parseTab("movimientos")).toBe("movimientos");
    expect(parseTab(undefined)).toBe("lotes");
  });
  it("builds the query keeping only set filters", () => {
    expect(detailQuery({ ubicacion: "a", pestana: "lotes", pagina: 1 })).toBe("?ubicacion=a");
    expect(detailQuery({ ubicacion: "a", pestana: "movimientos", tipo: "write_off", desde: "2026-11-01", pagina: 2 })).toBe(
      "?ubicacion=a&pestana=movimientos&tipo=write_off&desde=2026-11-01&pagina=2",
    );
  });
  it("labels and signs", () => {
    expect(movementTypeLabel("transfer_in")).toBe("Traslado (entrada)");
    expect(lotOriginLabel("purchase")).toBe("Compra");
    expect(signedQty(5, "5 lb")).toBe("+5 lb");
    expect(signedQty(-5, "-5 lb")).toBe("−5 lb");
  });
});
