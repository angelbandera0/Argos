import { Chip } from "./chip";
import { formatMoney, type Currency } from "./spend-logic";

export function MoneyValue({
  value,
  currency,
  costs = true,
  signed,
  className,
}: {
  value: number | null;
  currency: Currency;
  costs?: boolean;
  signed?: boolean;
  className?: string;
}) {
  if (!costs) return null;
  if (value === null) return <Chip variant="ring" className={className}>Sin costo conocido</Chip>;
  return <span className={`ui-money-value${className ? ` ${className}` : ""}`}>{formatMoney(value, currency, signed)}</span>;
}
