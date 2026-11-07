/** Page number from the `pagina` search param (1 when missing or invalid). */
export function parsePage(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
