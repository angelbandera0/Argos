import { RuleViolation } from "../errors";
import { mul, qty, type Qty } from "./quantity";

export type Magnitude = "weight" | "volume" | "count";
export type Unit = "lb" | "kg" | "g" | "oz" | "l" | "ml" | "u";

export const KG_PER_LB = 0.45359237;

export const BASE_UNIT: Record<Magnitude, Unit> = { weight: "lb", volume: "l", count: "u" };

const MAGNITUDE: Record<Unit, Magnitude> = { lb: "weight", kg: "weight", g: "weight", oz: "weight", l: "volume", ml: "volume", u: "count" };

export const unitsOf = (m: Magnitude): Unit[] => (Object.keys(MAGNITUDE) as Unit[]).filter((u) => MAGNITUDE[u] === m);
export const magnitudeOf = (unit: Unit): Magnitude => MAGNITUDE[unit];

const BASE_PER_UNIT: Record<Unit, number> = { lb: 1, kg: 1 / KG_PER_LB, g: 0.001 / KG_PER_LB, oz: 1 / 16, l: 1, ml: 0.001, u: 1 };

function check(unit: Unit, magnitude?: Magnitude) {
  if (!(unit in MAGNITUDE)) throw new RuleViolation("INVALID_INPUT");
  if (magnitude && MAGNITUDE[unit] !== magnitude) throw new RuleViolation("UNIT_MAGNITUDE_MISMATCH");
}

export function convertToBase(value: number | string, unit: Unit, magnitude?: Magnitude): Qty {
  check(unit, magnitude);
  return mul(qty(value), BASE_PER_UNIT[unit]);
}

export function convertFromBase(base: Qty, unit: Unit, magnitude?: Magnitude): Qty {
  check(unit, magnitude);
  return mul(base, 1 / BASE_PER_UNIT[unit]);
}

/** Units of `to` per one `from`, e.g. unitRatio("kg","lb") = 2.2046. */
export function unitRatio(from: Unit, to: Unit): number {
  check(from, MAGNITUDE[to]);
  return BASE_PER_UNIT[from] / BASE_PER_UNIT[to];
}

/** Converts between units of the same magnitude with a single rounding. */
export const convertUnits = (value: number | string, from: Unit, to: Unit): Qty => mul(qty(value), unitRatio(from, to));
