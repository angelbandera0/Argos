export type StatusFilter = "" | "activas" | "inactivas";

export function parseStatusFilter(value: unknown): StatusFilter {
  return value === "activas" || value === "inactivas" ? value : "";
}

export const activeParam = (f: StatusFilter): boolean | undefined => (f === "" ? undefined : f === "activas");

export function formatAmount(value: number, decimals: number): string {
  return new Intl.NumberFormat("es", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export const denominationsLabel = (n: number) => (n === 0 ? "Ninguna" : `${n} ${n === 1 ? "denominación" : "denominaciones"}`);

export function currencyErrorMessage(code: string | undefined): string {
  if (code === "CURRENCY_IN_USE")
    return "Esta divisa ya se usa en pedidos o existencias, así que no se puede eliminar. Puedes desactivarla.";
  return "No se pudo completar la acción. Inténtalo de nuevo.";
}
