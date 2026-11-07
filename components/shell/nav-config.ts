import type { Module, PermissionMap } from "@/core/domain/permissions";
import type { NavItem } from "./app-shell";

export type NavSection = { title: string; items: NavItem[] };
export type NavActor = { kind: "superadmin" | "admin" | "operator"; permissions?: PermissionMap };

const item = (id: string, label: string, href: string, icon: NavItem["icon"], extra?: Partial<NavItem>): NavItem => ({ id, label, href, icon, ...extra });

export const NAV = {
  home: item("inicio", "Inicio", "/", "LayoutDashboard"),
  notifications: item("notificaciones", "Notificaciones", "/notificaciones", "Bell"),
  stock: item("existencias", "Existencias", "/existencias", "Warehouse"),
  requests: item("solicitudes", "Solicitudes", "/solicitudes", "ClipboardList"),
  orders: item("pedidos", "Pedidos", "/pedidos", "ShoppingBag", { available: false }),
  products: item("productos", "Productos", "/catalogo/productos", "Box"),
  categories: item("categorias", "Categorías", "/catalogo/categorias", "Tags"),
  reasons: item("motivos", "Motivos de baja", "/existencias/motivos", "ClipboardList"),
  currencies: item("divisas", "Divisas", "/divisas", "Banknote"),
  companies: item("companias", "Compañías", "/companias", "Building2"),
  roles: item("roles", "Roles", "/roles", "KeyRound"),
  users: item("usuarios", "Usuarios", "/usuarios", "Users"),
  admins: item("administradores", "Administradores", "/superadmin/administradores", "ShieldCheck"),
  history: item("historial", "Historial", "/historial", "History"),
  productsHistory: item("historial", "Historial de Productos", "/historial/products", "History"),
};

const WAREHOUSE: [Module, NavItem][] = [["stock", NAV.stock], ["requests", NAV.requests], ["orders", NAV.orders]];

export function buildNav({ kind, permissions }: NavActor): NavSection[] {
  const admin = kind === "admin";
  const operator = kind === "operator";
  const can = (m: Module) => admin || (operator && !!permissions?.[m]?.view);
  const sections: NavSection[] = [
    { title: "General", items: [NAV.home, NAV.notifications] },
    { title: "Almacén", items: [...WAREHOUSE.filter(([m]) => can(m)).map(([, i]) => i), ...(admin ? [NAV.reasons] : [])] },
    {
      title: "Catálogo",
      items: [...(can("products") ? [NAV.products] : []), ...(admin ? [NAV.categories, NAV.currencies] : [])],
    },
    {
      title: "Administración",
      items: admin
        ? [NAV.companies, NAV.roles, NAV.users, NAV.history]
        : kind === "superadmin"
          ? [NAV.admins, NAV.companies, NAV.history]
          : can("products")
            ? [NAV.productsHistory]
            : [],
    },
  ];
  return sections.filter((s) => s.items.length > 0);
}
