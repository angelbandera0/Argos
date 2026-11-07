import { RuleViolation } from "../errors";
import { div, isZero, mul, toNumber, type Qty } from "./quantity";

export type Presentation = { name: string; content: Qty };
export type MovementUnit = { name: string; equivalence: Qty };

export type Captured = { captured: { qty: Qty; unitName: string }; base: Qty; content: Qty };

export function capture(amount: Qty, source: Presentation | MovementUnit, overrideContent?: Qty): Captured {
  const content = overrideContent ?? ("content" in source ? source.content : source.equivalence);
  if (isZero(content) || content < 0) throw new RuleViolation("INVALID_CONTENT");
  return { captured: { qty: amount, unitName: source.name }, base: mul(amount, toNumber(content)), content };
}

export function baseToMovementUnits(base: Qty, unit: MovementUnit): Qty {
  if (isZero(unit.equivalence) || unit.equivalence < 0) throw new RuleViolation("INVALID_CONTENT");
  return div(base, unit.equivalence);
}
