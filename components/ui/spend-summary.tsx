import { barPercent, formatMoney, surplus, type Currency } from "./spend-logic";

export function SpendSummary({
  delivered,
  spent,
  currency,
  products,
  hideAmounts = false,
}: {
  delivered: number;
  spent: number;
  currency: Currency;
  products?: { name: string; amount: number }[];
  hideAmounts?: boolean;
}) {
  if (hideAmounts) return null;
  const left = surplus(delivered, spent, currency);
  const over = left < 0;
  const max = Math.max(0, ...(products ?? []).map((p) => p.amount));
  return (
    <div className="ui-spend">
      <div className="ui-spend-cells">
        <div className="ui-spend-cell">
          <span className="ui-spend-label">Entregado</span>
          <span className="ui-spend-value">{formatMoney(delivered, currency)}</span>
        </div>
        <div className="ui-spend-cell">
          <span className="ui-spend-label">Gastado</span>
          <span className="ui-spend-value">{formatMoney(spent, currency)}</span>
        </div>
        <div className={`ui-spend-cell ${over ? "ui-spend-over" : "ui-spend-ok"}`}>
          <span className="ui-spend-label">{over ? "Excedido" : "Sobrante"}</span>
          <span className="ui-spend-value">{formatMoney(left, currency, true)}</span>
        </div>
      </div>
      {products && products.length > 0 && (
        <ul className="ui-spend-products" aria-label="Gasto por producto">
          {products.map((p) => (
            <li key={p.name}>
              <div className="ui-spend-product">
                <span>{p.name}</span>
                <span>{formatMoney(p.amount, currency)}</span>
              </div>
              <div className="ui-spend-bar" aria-hidden="true">
                <span style={{ width: `${barPercent(p.amount, max)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
