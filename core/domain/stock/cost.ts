import { RuleViolation } from "../errors";
import { toNumber, type Qty } from "./quantity";

export const COST_DECIMALS = 6;

const roundCost = (n: number) => {
  const f = 10 ** COST_DECIMALS;
  return Math.floor(Number((n * f).toPrecision(14)) + 0.5) / f;
};

export function unitCostPerBase(pricePerPresentation: number, content: Qty): number {
  if (!Number.isFinite(pricePerPresentation) || pricePerPresentation < 0 || content <= 0) throw new RuleViolation("INVALID_INPUT");
  return roundCost(pricePerPresentation / toNumber(content));
}

export const lineTotal = (base: Qty, unitCost: number) => roundCost(toNumber(base) * unitCost);
