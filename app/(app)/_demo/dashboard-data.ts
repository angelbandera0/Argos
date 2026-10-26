// DEMO: todos los datos de este archivo son FALSOS y provisionales.
// El dashboard de inicio solo lee de aquí; pasar a datos reales es sustituir este módulo.

export type DemoMeter = { id: string; label: string; detail: string; percent: number; tone: "open" | "strong" | "red" };
export type DemoCount = { id: string; label: string; value: number; icon: "Building2" | "Store" | "Box" | "Users" | "KeyRound" | "Tags" };
export type DemoSeries = { id: string; label: string; unit: string; values: number[] };
export type DemoUser = { id: string; name: string; place: string; state: "Bloqueado" | "Por desbloquear"; note: string };
export type DemoEvent = { id: string; icon: "UserPlus" | "Store" | "KeyRound" | "Box" | "Lock"; text: string; who: string; when: string };
export type DemoCompany = { id: string; name: string; active: boolean; sites: number; stores: number; users: number };

export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const adminDemo = {
  meters: [
    { id: "sedes", label: "Sedes activas", detail: "8 de 9", percent: 89, tone: "open" },
    { id: "tiendas", label: "Tiendas activas", detail: "14 de 17", percent: 82, tone: "strong" },
    { id: "usuarios", label: "Usuarios activos", detail: "47 de 62", percent: 76, tone: "red" },
  ] satisfies DemoMeter[],
  counts: [
    { id: "companias", label: "Compañías", value: 4, icon: "Building2" },
    { id: "sedes", label: "Sedes", value: 9, icon: "Building2" },
    { id: "tiendas", label: "Tiendas", value: 17, icon: "Store" },
    { id: "usuarios", label: "Usuarios", value: 62, icon: "Users" },
    { id: "roles", label: "Roles", value: 8, icon: "KeyRound" },
    { id: "productos", label: "Productos", value: 241, icon: "Box" },
  ] satisfies DemoCount[],
  series: [
    { id: "usuarios", label: "Usuarios", unit: "usuarios", values: [3, 5, 4, 6, 8, 5, 2] },
    { id: "tiendas", label: "Tiendas", unit: "tiendas", values: [1, 0, 2, 1, 3, 1, 0] },
    { id: "productos", label: "Productos", unit: "productos", values: [12, 18, 15, 22, 17, 9, 4] },
  ] satisfies DemoSeries[],
  blocked: [
    { id: "b1", name: "Operador 01", place: "Tienda Centro", state: "Bloqueado", note: "5 intentos fallidos" },
    { id: "b2", name: "Operadora 02", place: "Tienda Norte", state: "Por desbloquear", note: "Pidió ayuda hoy" },
    { id: "b3", name: "Operador 03", place: "Tienda Sur", state: "Bloqueado", note: "5 intentos fallidos" },
  ] satisfies DemoUser[],
  activity: [
    { id: "e1", icon: "UserPlus", text: "Alta de usuario operador01", who: "Administrador de ejemplo", when: "hace 12 min" },
    { id: "e2", icon: "Store", text: "Tienda Centro desactivada", who: "Administrador de ejemplo", when: "hace 1 h" },
    { id: "e3", icon: "KeyRound", text: "Rol «Cajero» actualizado", who: "Administradora de ejemplo", when: "hace 3 h" },
    { id: "e4", icon: "Box", text: "Producto P-0042 creado", who: "Administrador de ejemplo", when: "ayer" },
    { id: "e5", icon: "Lock", text: "PIN de operador03 restablecido", who: "Administradora de ejemplo", when: "ayer" },
  ] satisfies DemoEvent[],
  companies: [
    { id: "c1", name: "Compañía Ejemplo A", active: true, sites: 3, stores: 7, users: 24 },
    { id: "c2", name: "Compañía Ejemplo B", active: true, sites: 4, stores: 8, users: 31 },
    { id: "c3", name: "Compañía Ejemplo C", active: false, sites: 2, stores: 2, users: 7 },
  ] satisfies DemoCompany[],
};

export const operatorDemo = {
  store: { name: "Tienda Centro", site: "Sede Principal", company: "Compañía Ejemplo A" },
  session: { endsAt: "18:30", remaining: "5 h 20 min" },
  access: [
    { id: "a1", label: "Productos", detail: "Ver y crear" },
    { id: "a2", label: "Historial de productos", detail: "Solo ver" },
  ],
};
