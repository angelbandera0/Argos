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
    const a = checklist("Cajero", 1, none);
    expect(a.complete).toBe(true);
    expect(a.items[2].state).toBe("warn");
    const b = checklist("Ca", 0, read);
    expect(b.complete).toBe(false);
    expect(b.items.map((i) => i.state)).toEqual(["todo", "todo", "ok"]);
  });
});
