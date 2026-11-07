export type Split = { sum: number; diff: number; ok: boolean; label: string };

const round = (n: number) => Number(n.toFixed(3));

export function splitStatus(total: number, values: number[]): Split {
  const sum = round(values.reduce((s, v) => s + v, 0));
  const diff = round(total - sum);
  const label = diff === 0 ? `Cuadra: ${sum} de ${total}` : diff > 0 ? `Faltan ${diff} por repartir` : `Sobran ${-diff}`;
  return { sum, diff, ok: diff === 0, label };
}
