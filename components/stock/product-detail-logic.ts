export const MOVEMENT_PAGE_SIZE = 10;

export const MOVEMENT_TYPES: Record<string, string> = {
  initial_entry: "Entrada inicial",
  purchase_entry: "Entrada por compra",
  direct_entry: "Entrada directa",
  transfer_out: "Traslado (salida)",
  transfer_in: "Traslado (entrada)",
  write_off: "Baja",
  adjustment: "Ajuste",
  consumption: "Consumo",
};

export const LOT_ORIGINS: Record<string, string> = {
  initial_entry: "Entrada inicial",
  purchase: "Compra",
  direct_entry: "Entrada directa",
  transfer: "Traslado",
};

export const movementTypeLabel = (t: string) => MOVEMENT_TYPES[t] ?? t;
export const lotOriginLabel = (o: string) => LOT_ORIGINS[o] ?? o;

export const parseMovementType = (v: unknown) => (typeof v === "string" && v in MOVEMENT_TYPES ? v : "");
export const parseIsoDate = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export type DetailFilters = { ubicacion: string; pestana: "lotes" | "movimientos" | "configuracion"; tipo: string; desde: string; hasta: string; pagina: number };

export const parseTab = (v: unknown): DetailFilters["pestana"] => (v === "movimientos" || v === "configuracion" ? v : "lotes");

export function detailQuery(f: Partial<DetailFilters>): string {
  const sp = new URLSearchParams();
  if (f.ubicacion) sp.set("ubicacion", f.ubicacion);
  if (f.pestana === "movimientos" || f.pestana === "configuracion") sp.set("pestana", f.pestana);
  if (f.tipo) sp.set("tipo", f.tipo);
  if (f.desde) sp.set("desde", f.desde);
  if (f.hasta) sp.set("hasta", f.hasta);
  if (f.pagina && f.pagina > 1) sp.set("pagina", String(f.pagina));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function signedQty(delta: number, text: string) {
  return delta > 0 ? `+${text}` : delta < 0 ? `−${text.replace(/^-/, "")}` : text;
}
