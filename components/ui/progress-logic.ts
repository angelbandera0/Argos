export function progressPercent(value: number, max = 100) {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  return Math.round(Math.min(Math.max(value, 0), max) / max * 100);
}

