export type MultiselectOption = { value: string; label: string; disabled?: boolean; hint?: string };

export function pickOptions(options: MultiselectOption[], values: string[]) {
  return values.flatMap((v) => options.filter((o) => o.value === v));
}

export function splitTags<T>(selected: T[], max: number) {
  return { visible: selected.slice(0, max), hidden: Math.max(0, selected.length - max) };
}
