export type StepState = "complete" | "current" | "pending" | "error";

export function stepState(index: number, current: number, errorIndex?: number): StepState {
  if (index === errorIndex) return "error";
  if (index < current) return "complete";
  if (index === current) return "current";
  return "pending";
}

export type Crumb = { label: string; href?: string };

export function collapseCrumbs(items: Crumb[], max = 4) {
  if (items.length <= max) return { head: items, hidden: [] as Crumb[], tail: [] as Crumb[] };
  return { head: items.slice(0, 1), hidden: items.slice(1, -2), tail: items.slice(-2) };
}

export const isActivePath = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
