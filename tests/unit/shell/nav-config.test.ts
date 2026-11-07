import { describe, expect, it } from "vitest";
import { buildNav } from "@/components/shell/nav-config";
import { hasStockAlert, unreadBadge } from "@/components/shell/nav-indicators";

const view = { view: true, create: false, edit: false, delete: false };
const none = { ...view, view: false };
const ids = (n: ReturnType<typeof buildNav>) => n.flatMap((s) => s.items.map((i) => i.id));

describe("buildNav", () => {
  it("gives admins the four sections in order", () => {
    const nav = buildNav({ kind: "admin" });
    expect(nav.map((s) => s.title)).toEqual(["General", "Almacén", "Catálogo", "Administración"]);
    expect(ids(nav)).toEqual(["inicio", "notificaciones", "existencias", "solicitudes", "pedidos", "motivos", "productos", "categorias", "divisas", "companias", "roles", "usuarios", "historial"]);
  });

  it("marks only the pages not built yet as unavailable", () => {
    const warehouse = buildNav({ kind: "admin" })[1].items;
    expect(warehouse.filter((i) => i.available === false).map((i) => i.id)).toEqual([]);
  });

  it("shows operators only what their permissions allow", () => {
    const nav = buildNav({ kind: "operator", permissions: { products: view, stock: view, requests: none } });
    expect(ids(nav)).toEqual(["inicio", "notificaciones", "existencias", "productos", "historial"]);
    expect(nav.at(-1)?.items[0].label).toBe("Historial de Productos");
  });

  it("hides empty sections for operators without permissions", () => {
    expect(buildNav({ kind: "operator", permissions: { products: none } }).map((s) => s.title)).toEqual(["General"]);
  });

  it("keeps the superadmin menu minimal", () => {
    expect(ids(buildNav({ kind: "superadmin" }))).toEqual(["inicio", "notificaciones", "administradores", "companias", "historial"]);
  });
});

describe("nav indicators", () => {
  it("shows the unread count, capped at 99+", () => {
    expect(unreadBadge(0)).toBeUndefined();
    expect(unreadBadge(3)).toEqual({ kind: "alert", text: "3" });
    expect(unreadBadge(150)?.text).toBe("99+");
  });
  it("flags stock only when something is low or out", () => {
    expect(hasStockAlert([{ normal: 4, low: 0, out: 0 }])).toBe(false);
    expect(hasStockAlert([{ normal: 4, low: 0, out: 0 }, { normal: 0, low: 1, out: 0 }])).toBe(true);
  });
});
