import type { NavIconName } from "@/components/icons";
import type { Module, Op, PermissionSet, SpecialGrant, SpecialPermission } from "@/core/domain/permissions";

export const OPS: { op: Op; label: string }[] = [
  { op: "view", label: "Ver" },
  { op: "create", label: "Crear" },
  { op: "edit", label: "Editar" },
  { op: "delete", label: "Eliminar" },
];

export const SESSION_HOURS = [4, 8, 12, 24];

export const ADMIN_ONLY_MODULES = ["Compañías", "Sedes", "Tiendas", "Usuarios", "Roles", "Categorías"];

const set = (view: boolean, create: boolean, edit: boolean, del: boolean): PermissionSet => ({ view, create, edit, delete: del });

export const TEMPLATES: { key: string; label: string; set: PermissionSet }[] = [
  { key: "read", label: "Solo consulta", set: set(true, false, false, false) },
  { key: "ops", label: "Operativo", set: set(true, true, true, false) },
  { key: "full", label: "Completo", set: set(true, true, true, true) },
  { key: "none", label: "Ninguno", set: set(false, false, false, false) },
];

export function matchTemplate(p: PermissionSet): string | null {
  return TEMPLATES.find((t) => OPS.every(({ op }) => t.set[op] === p[op]))?.key ?? null;
}

export function toggle(p: PermissionSet, op: Op, on: boolean): PermissionSet {
  if (op === "view") return on ? { ...p, view: true } : set(false, false, false, false);
  return { ...p, [op]: on, view: on ? true : p.view };
}

export const isViewLocked = (p: PermissionSet) => p.create || p.edit || p.delete;

export const viewOnly = (key: Module) => key === "notifications";

export function allState(p: PermissionSet, only = false): "all" | "some" | "none" {
  const ops = only ? OPS.slice(0, 1) : OPS;
  const n = ops.filter(({ op }) => p[op]).length;
  return n === ops.length ? "all" : n === 0 ? "none" : "some";
}

export const toggleAll = (p: PermissionSet, only = false): PermissionSet =>
  allState(p, only) === "all" ? set(false, false, false, false) : set(true, !only, !only, !only);

export const permissionSummary = (p: PermissionSet) =>
  OPS.filter(({ op }) => p[op])
    .map(({ label }) => label)
    .join(" · ") || "Sin permisos";

export const sessionSummary = (hours: string) => (hours ? `Sesión: ${hours} h` : "Sesión: tope de la compañía");

export function nameError(name: string): string | undefined {
  const n = name.trim().length;
  if (n === 0) return "Escribe un nombre para el rol.";
  if (n < 3) return "Escribe al menos 3 letras.";
  return undefined;
}

export type SpecialDef = { key: SpecialPermission; label: string; description: string; scoped?: boolean };
export type ModuleGroup = { key: Exclude<Module, "products">; label: string; description: string; icon: NavIconName; specials: SpecialDef[] };

export const SEE_COSTS: SpecialDef = {
  key: "see_costs",
  label: "Ver costos",
  description: "Muestra costos unitarios, valores, montos entregados y gastados en todas las pantallas. Sin él, esas cifras no aparecen.",
};

export const MODULE_GROUPS: ModuleGroup[] = [
  { key: "currencies", label: "Divisas", description: "Monedas y denominaciones", icon: "Coins", specials: [] },
  {
    key: "stock",
    label: "Existencias",
    description: "Almacén, lotes, traslados y bajas",
    icon: "Box",
    specials: [
      { key: "choose_lot", label: "Elegir lote en salidas", description: "Decide de qué lote sale la mercancía.", scoped: true },
      { key: "initial_entry", label: "Entrada inicial", description: "Registra las existencias con las que arranca un producto.", scoped: true },
      { key: "direct_store_entry", label: "Entrada directa a tienda", description: "Da entrada a una tienda sin pasar por el almacén." },
      { key: "transfer", label: "Trasladar a tienda", description: "Envía mercancía del almacén a las tiendas.", scoped: true },
      { key: "write_off", label: "Dar bajas", description: "Descuenta mercancía dañada, vencida o perdida.", scoped: true },
      { key: "adjust_stock", label: "Ajustar existencias", description: "Corrige la cantidad registrada tras un conteo.", scoped: true },
      { key: "configure_units", label: "Configurar unidades", description: "Define unidades y presentaciones del producto." },
      { key: "configure_minimums", label: "Configurar mínimos", description: "Fija las existencias mínimas de cada producto.", scoped: true },
    ],
  },
  {
    key: "requests",
    label: "Solicitudes",
    description: "Reposición de las tiendas",
    icon: "Inbox",
    specials: [
      { key: "request_replenishment", label: "Solicitar reposición", description: "Pide mercancía al almacén desde una tienda." },
      { key: "handle_requests", label: "Atender solicitudes", description: "Responde las solicitudes de las tiendas.", scoped: true },
    ],
  },
  {
    key: "orders",
    label: "Pedidos",
    description: "Compras y su revisión",
    icon: "Tags",
    specials: [
      { key: "build_orders", label: "Armar pedidos", description: "Prepara pedidos con lo que hay que comprar." },
      { key: "make_purchases", label: "Realizar compras", description: "Registra las compras de un pedido." },
      { key: "review_orders", label: "Revisar pedidos", description: "Revisa la mercancía recibida contra el pedido.", scoped: true },
      { key: "correct_orders", label: "Corregir pedidos", description: "Corrige un pedido ya cumplido." },
    ],
  },
  { key: "notifications", label: "Notificaciones", description: "Avisos de la aplicación", icon: "Bell", specials: [] },
];

export type MatrixModule = { key: Module; label: string; description: string; icon: NavIconName };

export const ALL_MODULES: MatrixModule[] = [{ key: "products", label: "Productos", description: "Catálogo, precios y existencias", icon: "Box" }, ...MODULE_GROUPS];

export const NONE: PermissionSet = set(false, false, false, false);

export function toggleSpecial(grants: SpecialGrant[], permission: SpecialPermission, on: boolean): SpecialGrant[] {
  const rest = grants.filter((g) => g.permission !== permission);
  return on ? [...rest, { permission, warehouse: false }] : rest;
}

export const setWarehouse = (grants: SpecialGrant[], permission: SpecialPermission, warehouse: boolean): SpecialGrant[] =>
  grants.map((g) => (g.permission === permission ? { ...g, warehouse } : g));

export function pruneSpecials(permissions: Record<Module, PermissionSet>, grants: SpecialGrant[]): SpecialGrant[] {
  const blocked = new Set(MODULE_GROUPS.filter((m) => !permissions[m.key].view).flatMap((m) => m.specials.map((s) => s.key)));
  return grants.filter((g) => !blocked.has(g.permission));
}

export const hasAnyPermission = (permissions: Record<Module, PermissionSet>, grants: SpecialGrant[]) =>
  grants.length > 0 || Object.values(permissions).some((p) => OPS.some(({ op }) => p[op]));

export function abilities(permissions: Record<Module, PermissionSet>, grants: SpecialGrant[]): { label: string; text: string }[] {
  const rows = [{ label: "Productos", text: permissionSummary(permissions.products) }];
  for (const m of MODULE_GROUPS) {
    const ops = permissionSummary(permissions[m.key]);
    if (ops === "Sin permisos") continue;
    const n = specialCount(m, grants);
    rows.push({ label: m.label, text: n ? `${ops} · ${n} ${n === 1 ? "permiso especial" : "permisos especiales"}` : ops });
  }
  return rows;
}

const specialCount = (m: ModuleGroup, grants: SpecialGrant[]) => m.specials.filter((s) => grants.some((g) => g.permission === s.key)).length;

export const modulePermissionCount = (p: PermissionSet, m: ModuleGroup, grants: SpecialGrant[]) =>
  OPS.filter(({ op }) => p[op]).length + specialCount(m, grants);

export const specialLabels = (grants: SpecialGrant[]) =>
  [SEE_COSTS, ...MODULE_GROUPS.flatMap((m) => m.specials)].filter((s) => grants.some((g) => g.permission === s.key)).map((s) => s.label);

export type CheckItem = { state: "ok" | "warn" | "todo"; label: string };

export function checklist(name: string, companies: number, hasPerms: boolean): { items: CheckItem[]; complete: boolean } {
  const nameOk = !nameError(name);
  return {
    complete: nameOk && companies > 0,
    items: [
      { state: nameOk ? "ok" : "todo", label: "Nombre de al menos 3 letras" },
      { state: companies > 0 ? "ok" : "todo", label: "Al menos una compañía" },
      { state: hasPerms ? "ok" : "warn", label: hasPerms ? "Tiene permisos asignados" : "Sin permisos: solo podrá iniciar sesión" },
    ],
  };
}
