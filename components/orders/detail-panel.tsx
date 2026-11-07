import { MoneyValue } from "@/components/ui/money-value";
import { SpendSummary } from "@/components/ui/spend-summary";
import { StateTimeline, type TimelineStep } from "@/components/ui/state-timeline";
import type { Currency } from "@/components/ui/spend-logic";
import { Card } from "@/components/ui/card";
import type { OrderDetail } from "@/core/application/ports/order-repository";
import { missing, surplus } from "./review-logic";

export function DetailPanel({ order, steps, currency }: { order: OrderDetail; steps: TimelineStep[]; currency: Currency }) {
  const costs = order.spent !== undefined;
  return (
    <div className="stack">
      <Card>
        <h2>Línea de tiempo</h2>
        <StateTimeline steps={steps} orientation="vertical" />
      </Card>
      {costs && order.amountGiven != null && order.spent != null && <SpendSummary delivered={order.amountGiven} spent={order.spent} currency={currency} products={[]} />}
      <Card>
        <h2>Productos</h2>
        <table className="ui-three-qty">
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Pedida</th>
              <th scope="col">Comprada</th>
              <th scope="col">Recibida</th>
              <th scope="col">Faltante</th>
              <th scope="col">Sobrante</th>
              {costs && <th scope="col">Costo unit.</th>}
              {order.shortageValue !== undefined && <th scope="col">Faltante valorado</th>}
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => {
              const rec = l.qtyReceived ?? 0;
              return (
                <tr key={l.id}>
                  <th scope="row">{l.productName}</th>
                  <td className="num">{l.qty} {l.unit}</td>
                  <td className="num">{l.qtyBought ?? "—"}</td>
                  <td className="num">{l.qtyReceived ?? "—"}</td>
                  <td className="num">{l.qtyReceived === null ? "—" : missing(l.qtyBought, rec)}</td>
                  <td className="num">{l.qtyReceived === null ? "—" : surplus(l.qtyBought, rec)}</td>
                  {costs && <td className="num"><MoneyValue value={l.unitCost ?? null} currency={currency} /></td>}
                  {order.shortageValue !== undefined && <td className="num"><MoneyValue value={l.shortageValue ?? null} currency={currency} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
