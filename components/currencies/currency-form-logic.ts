import type { Denomination } from "@/core/application/ports/currency-repository";
import { formatAmount } from "./currency-list-logic";

export const SAMPLE_AMOUNT = 1234.5;

export const KIND_OPTIONS = [
  { value: "bill", label: "Billete" },
  { value: "coin", label: "Moneda" },
];

export const kindLabel = (kind: string) => KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind;

export interface CurrencyDraft {
  code: string;
  name: string;
  symbol: string;
  decimals: string;
}

export type CurrencyErrors = Partial<Record<keyof CurrencyDraft, string>>;

export function currencyErrors(d: CurrencyDraft): CurrencyErrors {
  const e: CurrencyErrors = {};
  if (!d.code.trim() || d.code.trim().length > 10) e.code = "Escribe un código de hasta 10 caracteres.";
  if (!d.name.trim() || d.name.trim().length > 80) e.name = "Escribe un nombre de hasta 80 caracteres.";
  if (!d.symbol.trim() || d.symbol.trim().length > 8) e.symbol = "Escribe un símbolo de hasta 8 caracteres.";
  const n = Number(d.decimals);
  if (d.decimals.trim() === "" || !Number.isInteger(n) || n < 0 || n > 4) e.decimals = "Elige entre 0 y 4 decimales.";
  return e;
}

export function previewAmount(symbol: string, decimals: string, amount = SAMPLE_AMOUNT): string {
  const n = Number(decimals);
  const d = Number.isInteger(n) && n >= 0 && n <= 4 ? n : 2;
  return `${symbol.trim()} ${formatAmount(amount, d)}`.trim();
}

export const moneyExamples = (code: string, decimals: string) => {
  const n = Number(decimals);
  const d = Number.isInteger(n) && n >= 0 && n <= 4 ? n : 2;
  const c = code.trim();
  return [
    { label: "Monto grande", value: formatAmount(12500, d) },
    { label: "Precio", value: formatAmount(32, d) },
    { label: "Céntimos", value: formatAmount(0.5, Math.max(d, 1)) },
    { label: "Con código", value: `${formatAmount(1234.5, d)} ${c}`.trim() },
  ];
};

/** Accepts "0,5" and "0.5"; returns null when not a positive number. */
export function parseDenominationValue(raw: string): number | null {
  const n = Number(raw.trim().replace(",", "."));
  return raw.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null;
}

export const formatDenominationValue = (value: number) =>
  new Intl.NumberFormat("es", { maximumFractionDigits: 4 }).format(value);

export const sortDenominations = (items: Denomination[]) => [...items].sort((a, b) => b.value - a.value);

export const hasValue = (items: Denomination[], value: number, exceptId?: string) =>
  items.some((d) => d.id !== exceptId && d.value === value);

export const DUPLICATE_VALUE_MESSAGE = "Ya existe una denominación con ese valor.";
