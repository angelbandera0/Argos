import { describe, expect, it } from "vitest";
import type { Module, PermissionSet } from "@/core/domain/permissions";
import { ALL_MODULES, NONE, grantedModules, groupedSpecials } from "@/components/roles/role-form-logic";

const all = (p: PermissionSet) => Object.fromEntries(ALL_MODULES.map((m) => [m.key, p])) as Record<Module, PermissionSet>;

describe("grantedModules", () => {
  it("vacío sin permisos", () => expect(grantedModules(all(NONE))).toEqual([]));
  it("solo módulos y operaciones concedidas", () => {
    const r = grantedModules({ ...all(NONE), stock: { view: true, create: false, edit: true, delete: false } });
    expect(r).toHaveLength(1);
    expect(r[0].label).toBe("Existencias");
    expect(r[0].ops.map((o) => o.op)).toEqual(["view", "edit"]);
  });
});

describe("groupedSpecials", () => {
  it("sin concesiones, vacío", () => expect(groupedSpecials([])).toEqual([]));
  it("agrupa por ámbito y marca almacén", () => {
    const g = groupedSpecials([{ permission: "see_costs", warehouse: false }]);
    expect(g).toHaveLength(1);
    expect(g[0].scope).toBe("General");
    expect(g[0].items[0]).toMatchObject({ key: "see_costs", warehouse: false });
  });
});
