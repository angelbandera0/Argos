export type Decisions = { transfers: number; purchases: number; rejections: number };

export const decisionsTotal = (d: Decisions) => d.transfers + d.purchases + d.rejections;

export function decisionsSummary(d: Decisions) {
  const total = decisionsTotal(d);
  const parts = [
    d.transfers > 0 && `${d.transfers} ${d.transfers === 1 ? "traslado" : "traslados"}`,
    d.purchases > 0 && `${d.purchases} por comprar`,
    d.rejections > 0 && `${d.rejections} ${d.rejections === 1 ? "rechazo" : "rechazos"}`,
  ].filter(Boolean);
  return [`${total} ${total === 1 ? "decisión lista" : "decisiones listas"}`, ...parts].join(" · ");
}
