import { describe, expect, it } from "vitest";
import {
  REASON_CODES,
  validateDeactivationReason,
  type ReasonCode,
} from "@/core/domain/deactivation";

describe("validateDeactivationReason", () => {
  it("lists the seven reason codes", () => {
    expect([...REASON_CODES]).toEqual([
      "cierre-definitivo",
      "cierre-temporal",
      "reestructuracion",
      "remodelacion",
      "creada-por-error",
      "fin-de-contrato",
      "otro",
    ]);
  });

  it("accepts a known code without text", () => {
    expect(() => validateDeactivationReason({ code: "cierre-temporal" })).not.toThrow();
  });

  it("rejects otro without text", () => {
    expect(() => validateDeactivationReason({ code: "otro" })).toThrow(
      expect.objectContaining({ code: "REASON_REQUIRED" }),
    );
  });

  it("rejects otro with blank text", () => {
    expect(() => validateDeactivationReason({ code: "otro", text: "   " })).toThrow(
      expect.objectContaining({ code: "REASON_REQUIRED" }),
    );
  });

  it("accepts otro with text", () => {
    expect(() =>
      validateDeactivationReason({ code: "otro", text: "Cambio de local" }),
    ).not.toThrow();
  });

  it("rejects an unknown code", () => {
    expect(() =>
      validateDeactivationReason({ code: "desconocido" as ReasonCode }),
    ).toThrow(expect.objectContaining({ code: "REASON_REQUIRED" }));
  });
});
