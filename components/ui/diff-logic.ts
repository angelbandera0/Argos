export type Unit = { one: string; many: string };
export type Diff = { kind: "match" | "diff" | "missing"; delta: number; label: string };

export function diffOf(received: number, reported: number, unit: Unit, notBought?: boolean): Diff {
  if (notBought) return { kind: "missing", delta: 0, label: "Faltante del pedido" };
  const delta = Number((received - reported).toFixed(3));
  if (delta === 0) return { kind: "match", delta, label: "Coincide" };
  const abs = Math.abs(delta);
  return { kind: "diff", delta, label: `${delta < 0 ? "−" : "+"}${abs} ${abs === 1 ? unit.one : unit.many}` };
}
