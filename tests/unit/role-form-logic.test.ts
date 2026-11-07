import { describe, expect, it } from "vitest";
import {
  allState,
  checklist,
  matchTemplate,
  nameError,
  permissionSummary,
  TEMPLATES,
  toggle,
  toggleAll,
  abilities,
  hasAnyPermission,
  NONE,
  pruneSpecials,
  setWarehouse,
  specialLabels,
  toggleSpecial,
} from "@/components/roles/role-form-logic";

const read = TEMPLATES[0].set;
const none = TEMPLATES[3].set;

describe("role form logic", () => {
  it("matches templates", () => {
    expect(matchTemplate(TEMPLATES[1].set)).toBe("ops");
    expect(matchTemplate({ view: true, create: false, edit: true, delete: false })).toBeNull();
    expect(matchTemplate(none)).toBe("none");
  });
  it("create/edit/delete force view; unchecking view clears all", () => {
    expect(toggle(none, "edit", true)).toEqual({ view: true, create: false, edit: true, delete: false });
    expect(toggle(TEMPLATES[2].set, "view", false)).toEqual(none);
    expect(toggle(read, "create", false).view).toBe(true);
  });
  it("all is mixed and toggles", () => {
    expect(allState(TEMPLATES[1].set)).toBe("some");
    expect(allState(TEMPLATES[2].set)).toBe("all");
    expect(toggleAll(TEMPLATES[1].set)).toEqual(TEMPLATES[2].set);
    expect(toggleAll(TEMPLATES[2].set)).toEqual(none);
  });
  it("summarises permissions", () => {
    expect(permissionSummary(TEMPLATES[1].set)).toBe("Ver · Crear · Editar");
    expect(permissionSummary(none)).toBe("Sin permisos");
  });
  it("validates the name", () => {
    expect(nameError("  ")).toMatch(/Escribe un nombre/);
    expect(nameError("ab")).toBe("Escribe al menos 3 letras.");
    expect(nameError("abc")).toBeUndefined();
  });
  it("checklist: permissions warn but do not block", () => {
    const a = checklist("Cajero", 1, false);
    expect(a.complete).toBe(true);
    expect(a.items[2].state).toBe("warn");
    const b = checklist("Ca", 0, true);
    expect(b.complete).toBe(false);
    expect(b.items.map((i) => i.state)).toEqual(["todo", "todo", "ok"]);
  });
  it("specials: toggle, warehouse scope and prune without view", () => {
    const perms = { products: NONE, currencies: NONE, stock: read, requests: NONE, orders: NONE, notifications: NONE };
    let g = toggleSpecial([], "transfer", true);
    g = setWarehouse(toggleSpecial(g, "write_off", true), "write_off", true);
    expect(g).toEqual([{ permission: "transfer", warehouse: false }, { permission: "write_off", warehouse: true }]);
    expect(pruneSpecials(perms, g)).toEqual(g);
    expect(pruneSpecials({ ...perms, stock: NONE }, [...g, { permission: "see_costs", warehouse: false }])).toEqual([{ permission: "see_costs", warehouse: false }]);
    expect(toggleSpecial(g, "transfer", false)).toHaveLength(1);
  });
  it("summaries", () => {
    const perms = { products: read, currencies: NONE, stock: TEMPLATES[1].set, requests: NONE, orders: NONE, notifications: NONE };
    const g = toggleSpecial([], "transfer", true);
    expect(abilities(perms, g)).toEqual([
      { label: "Productos", text: "Ver" },
      { label: "Existencias", text: "Ver · Crear · Editar · 1 permiso especial" },
    ]);
    expect(specialLabels(toggleSpecial(g, "see_costs", true))).toEqual(["Ver costos", "Trasladar a tienda"]);
    expect(hasAnyPermission({ ...perms, products: NONE, stock: NONE }, [])).toBe(false);
    expect(hasAnyPermission({ ...perms, products: NONE, stock: NONE }, g)).toBe(true);
  });
});
