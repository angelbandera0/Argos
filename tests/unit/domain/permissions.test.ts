import { describe, expect, it } from "vitest";
import { assertValidPermissions } from "@/core/domain/permissions";
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
