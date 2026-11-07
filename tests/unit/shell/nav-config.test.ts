import { describe, expect, it } from "vitest";
import { buildNav } from "@/components/shell/nav-config";

const view = { view: true, create: false, edit: false, delete: false };
const none = { ...view, view: false };
const ids = (n: ReturnType<typeof buildNav>) => n.flatMap((s) => s.items.map((i) => i.id));

describe("buildNav", () => {
  it("gives admins the four sections in order", () => {
    const nav = buildNav({ kind: "admin" });
    expect(nav.map((s) => s.title)).toEqual(["General", "Almacén", "Catálogo", "Administración"]);
    expect(ids(nav)).toEqual(["inicio", "notificaciones", "existencias", "solicitudes", "pedidos", "productos", "categorias", "divisas", "companias", "roles", "usuarios", "historial"]);
  });

  it("marks only the pages not built yet as unavailable", () => {
    const warehouse = buildNav({ kind: "admin" })[1].items;
    expect(warehouse.filter((i) => i.available === false).map((i) => i.id)).toEqual(["solicitudes", "pedidos"]);
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
