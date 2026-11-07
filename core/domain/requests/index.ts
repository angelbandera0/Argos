import { RuleViolation } from "@/core/domain/errors";
import { normalizeName } from "@/core/domain/name";
import { add, qty, sub, toNumber, type Qty } from "@/core/domain/stock";

export type AssignmentKind = "fulfilled" | "to_buy" | "pending" | "rejected";
export type LineStatus = "new" | "in_progress" | AssignmentKind;
export type RequestStatus = "new" | "in_progress" | "to_buy" | "pending" | "rejected" | "fulfilled";

export const ASSIGNMENT_KINDS: AssignmentKind[] = ["fulfilled", "to_buy", "pending", "rejected"];

export interface Assignment {
  kind: AssignmentKind;
  qtyBase: number;
}

const assignedQty = (a: Assignment[]): Qty => a.reduce((s, x) => add(s, qty(x.qtyBase)), qty(0));

export const assignedBase = (a: Assignment[]): number => toNumber(assignedQty(a));

export const remainingBase = (lineQtyBase: number, a: Assignment[]): number => toNumber(sub(qty(lineQtyBase), assignedQty(a), true));

/** Same derivation as the `solicitud_linea_estado` view. */
export function lineStatus(lineQtyBase: number, a: Assignment[]): LineStatus {
  const assigned = assignedBase(a);
  if (assigned === 0) return "new";
  if (assigned < lineQtyBase) return "in_progress";
  for (const kind of ["to_buy", "pending", "fulfilled"] as const) if (a.some((x) => x.kind === kind)) return kind;
  return "rejected";
}

/** Same derivation as the `solicitud_estado` view. */
export function requestStatus(lines: LineStatus[]): RequestStatus {
  if (lines.every((s) => s === "new")) return "new";
  if (lines.some((s) => s === "new" || s === "in_progress")) return "in_progress";
  if (lines.includes("to_buy")) return "to_buy";
  if (lines.includes("pending")) return "pending";
  if (lines.every((s) => s === "rejected")) return "rejected";
  return "fulfilled";
}

export interface AttendInput {
  kind: AssignmentKind;
  qtyBase: number;
  reason?: string;
}

/** Validates one decision against the quantity still undecided on the line. */
export function validateAttend(input: AttendInput, remaining: number): { qtyBase: number; reason?: string } {
  if (!ASSIGNMENT_KINDS.includes(input.kind)) throw new RuleViolation("INVALID_KIND");
  const q = qty(input.qtyBase);
  if (q <= 0) throw new RuleViolation("INVALID_QUANTITY");
  if (q > qty(remaining)) throw new RuleViolation("ASSIGNMENT_EXCEEDS_LINE");
  const reason = input.reason === undefined ? "" : normalizeName(input.reason);
  if (input.kind === "rejected" && !reason) throw new RuleViolation("REASON_REQUIRED");
  return { qtyBase: toNumber(q), reason: reason || undefined };
}
