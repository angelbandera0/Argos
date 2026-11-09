import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NONE } from "@/components/roles/role-form-logic";
import {
  type RolePreviewSource,
  rolePreview,
  stepForField,
  type UserDraft,
  userComplete,
  userFields,
  userNextStep,
  userStepKeys,
} from "@/components/users/user-form-logic";
import { roleErrorStep } from "@/components/roles/role-form-logic";

vi.mock("@/app/(app)/usuarios/actions", () => ({ checkUsernameAction: vi.fn(), createUserAction: vi.fn(), updateUserAction: vi.fn() }));

const perms = { products: { ...NONE, view: true }, currencies: NONE, stock: NONE, requests: NONE, orders: NONE, notifications: NONE };
const role: RolePreviewSource = {
  id: "r1",
  name: "Cajero",
  sessionSeconds: 28800,
  permissions: perms,
  grants: [{ permission: "transfer", warehouse: true }],
  companies: [{ id: "c1", name: "Alfa", allowed: true }, { id: "c2", name: "Beta", allowed: false }],
  users: ["Marta"],
};
const draft: UserDraft = { displayName: "Marta", username: "marta", usernameAvailable: true, roleId: "r1", roleValid: true, storeIds: ["s1", "s2"] };

describe("user stepper logic", () => {
  const keys = userStepKeys("create");
  it("steps per mode; summary last", () => {
    expect(keys).toEqual(["data", "role", "stores", "summary"]);
    expect(userStepKeys("edit")).toEqual(["role", "stores", "summary"]);
  });
  it("validates per step", () => {
    expect(userNextStep(keys, 0, { ...draft, displayName: " " }).error).toBeTruthy();
    expect(userNextStep(keys, 0, { ...draft, usernameAvailable: false }).error).toBeTruthy();
    expect(userNextStep(keys, 1, { ...draft, roleValid: false }).error).toMatch(/compañía/);
    expect(userNextStep(keys, 2, { ...draft, storeIds: [] }).error).toBeTruthy();
    expect(userNextStep(keys, 0, draft)).toEqual({ step: 1 });
    expect(userComplete(keys, draft)).toBe(true);
    expect(userComplete(keys, { ...draft, roleId: "" })).toBe(false);
  });
  it("builds the full payload from state", () => {
    expect(userFields(draft, "create")).toEqual([["displayName", "Marta"], ["name", "marta"], ["roleId", "r1"], ["storeId", "s1"], ["storeId", "s2"]]);
    expect(userFields(draft, "edit").map(([k]) => k)).toEqual(["roleId", "storeId", "storeId"]);
  });
  it("goes back to the step of the failing field", () => {
    expect(stepForField(keys, "name")).toBe(0);
    expect(stepForField(keys, "roleId")).toBe(1);
    expect(stepForField(keys, "storeIds")).toBe(2);
    expect(stepForField(keys, undefined)).toBe(-1);
    expect(stepForField(userStepKeys("edit"), "name")).toBe(-1);
    expect(roleErrorStep({ nameError: "x" })).toBe(0);
    expect(roleErrorStep({})).toBe(-1);
  });
  it("previews the role for the company", () => {
    expect(rolePreview(undefined, "c1")).toBeNull();
    const p = rolePreview(role, "c1")!;
    expect(p.validForCompany).toBe(true);
    expect(rolePreview(role, "c2")!.validForCompany).toBe(false);
    expect(p.moduleKeys).toHaveLength(6);
    expect(p.stats.map((s) => s.value)).toEqual(["1 compañía", "8 horas", "1 usuario"]);
  });
});

describe("UserStepper payload independent of the visible step", () => {
  it("renders every field as a hidden input while showing only the first step", async () => {
    const { UserStepper } = await import("@/components/users/user-stepper");
    const html = renderToStaticMarkup(
      createElement(UserStepper, {
        mode: "edit",
        userId: "u1",
        code: "alfa",
        companyId: "c1",
        companyName: "Alfa",
        roles: [role],
        stores: [{ id: "s1", name: "T1", site: "S" }, { id: "s2", name: "T2", site: "S" }],
        initial: { roleId: "r1", storeIds: ["s1", "s2"] },
      }),
    );
    expect(html).toContain('type="hidden" name="roleId" value="r1"');
    expect(html).toContain('type="hidden" name="storeId" value="s1"');
    expect(html).toContain('type="hidden" name="storeId" value="s2"');
    expect(html).toContain("Permisos por módulo");
    expect(html).not.toContain("ui-store-group");
  });
});
