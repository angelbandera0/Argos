import { describe, expect, it } from "vitest";
import { assertValidPermissions, hasSpecial } from "@/core/domain/permissions";
import { RuleViolation } from "@/core/domain/errors";

describe("assertValidPermissions", () => {
  it("rejects create without view", () => {
    const run = () =>
      assertValidPermissions({ view: false, create: true, edit: false, delete: false });
    expect(run).toThrow(RuleViolation);
    expect(run).toThrow(expect.objectContaining({ code: "PERMISSION_REQUIRES_VIEW" }));
  });

  it("rejects edit without view", () => {
    expect(() =>
      assertValidPermissions({ view: false, create: false, edit: true, delete: false }),
    ).toThrow(expect.objectContaining({ code: "PERMISSION_REQUIRES_VIEW" }));
  });

  it("rejects delete without view", () => {
    expect(() =>
      assertValidPermissions({ view: false, create: false, edit: false, delete: true }),
    ).toThrow(expect.objectContaining({ code: "PERMISSION_REQUIRES_VIEW" }));
  });

  it("accepts all false", () => {
    expect(() =>
      assertValidPermissions({ view: false, create: false, edit: false, delete: false }),
    ).not.toThrow();
  });

  it("accepts view with other operations", () => {
    expect(() =>
      assertValidPermissions({ view: true, create: true, edit: false, delete: true }),
    ).not.toThrow();
  });
});

describe("module rules", () => {
  it("limits notifications to view", () => {
    expect(() => assertValidPermissions({ view: true, create: false, edit: false, delete: true }, "notifications")).toThrow();
    expect(() => assertValidPermissions({ view: true, create: false, edit: false, delete: false }, "notifications")).not.toThrow();
  });
});

describe("hasSpecial", () => {
  const access = { specialPermissions: [{ permission: "transfer" as const, warehouse: false }, { permission: "write_off" as const, warehouse: true }] };
  it("checks the grant and the warehouse scope", () => {
    expect(hasSpecial(access, "transfer")).toBe(true);
    expect(hasSpecial(access, "transfer", { warehouse: true })).toBe(false);
    expect(hasSpecial(access, "write_off", { warehouse: true })).toBe(true);
    expect(hasSpecial(access, "adjust_stock")).toBe(false);
  });
});
