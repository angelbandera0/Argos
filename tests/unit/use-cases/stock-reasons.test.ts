import { describe, expect, it } from "vitest";
import { translateStockError } from "@/core/domain/errors";
import { admin, operator } from "./catalog-setup";
import { opsSetup } from "./stock-ops-setup";

const A = admin("a1");

describe("write-off reasons", () => {
  it("admins see all, operators with write_off only active ones", async () => {
    const s = opsSetup();
    expect(await s.listReasons(A, { companyId: "c1" })).toHaveLength(4);
    s.give("u-edit", ["write_off", true]);
    expect((await s.listReasons(operator("u-edit"), {})).map((r) => r.id).sort()).toEqual(["r-custom", "r-merma", "r-otro"]);
    await expect(s.listReasons(operator("u-view"), {})).rejects.toMatchObject({ name: "Forbidden" });
  });

  it("only admins write; code and name are unique", async () => {
    const s = opsSetup();
    const r = await s.createReason(A, { companyId: "c1", code: " Rota ", name: " Pieza  rota " });
    expect(r).toMatchObject({ code: "rota", name: "Pieza rota" });
    await expect(s.createReason(A, { companyId: "c1", code: "rota", name: "Otra" })).rejects.toMatchObject({ code: "CODE_TAKEN" });
    await expect(s.createReason(A, { companyId: "c1", code: "otra", name: "pieza ROTA" })).rejects.toMatchObject({ code: "NAME_TAKEN" });
    await expect(s.createReason(A, { companyId: "c1", code: "x y", name: "Z" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(s.createReason(A, { companyId: "c1", code: "largo", name: "x".repeat(61) })).rejects.toMatchObject({ code: "INVALID_NAME" });
    await expect(s.createReason(admin("a2"), { companyId: "c1", code: "z", name: "Z" })).rejects.toMatchObject({ name: "Forbidden" });
    s.give("u-edit", ["write_off", true]);
    await expect(s.createReason(operator("u-edit"), { companyId: "c1", code: "z", name: "Z" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.renameReason(operator("u-edit"), { id: "r-custom", name: "Z" })).rejects.toMatchObject({ name: "Forbidden" });
  });

  it("rename, deactivate and delete; standard reasons are locked", async () => {
    const s = opsSetup();
    await s.renameReason(A, { id: "r-custom", name: "Nuevo" });
    expect(s.reasons.rows.find((r) => r.id === "r-custom")!.name).toBe("Nuevo");
    await s.setReasonActive(A, { id: "r-custom", active: false });
    await s.setReasonActive(A, { id: "r-merma", active: false });
    await s.deleteReason(A, { id: "r-custom" });
    expect(s.reasons.rows.some((r) => r.id === "r-custom")).toBe(false);
    await expect(s.renameReason(A, { id: "r-merma", name: "X" })).rejects.toMatchObject({ code: "STANDARD_REASON_LOCKED" });
    await expect(s.deleteReason(A, { id: "r-merma" })).rejects.toMatchObject({ code: "STANDARD_REASON_LOCKED" });
    await expect(s.setReasonActive(A, { id: "r-otro", active: false })).rejects.toMatchObject({ code: "STANDARD_REASON_LOCKED" });
    await expect(s.renameReason(A, { id: "nope", name: "X" })).rejects.toMatchObject({ name: "NotFound" });
  });
});

describe("translateStockError", () => {
  it("maps database codes to domain errors", () => {
    expect(translateStockError("LOT_EXCEEDED")).toMatchObject({ name: "RuleViolation", code: "LOT_EXCEEDED" });
    expect(translateStockError("ERROR: COST_NOT_ALLOWED (42501)")).toMatchObject({ code: "COST_NOT_ALLOWED" });
    expect(translateStockError("FORBIDDEN")).toMatchObject({ name: "Forbidden" });
    expect(translateStockError("boom")).not.toHaveProperty("code");
  });
});
