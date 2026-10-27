import { RuleViolation } from "./errors";

export const REASON_CODES = [
  "cierre-definitivo",
  "cierre-temporal",
  "reestructuracion",
  "remodelacion",
  "creada-por-error",
  "fin-de-contrato",
  "otro",
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

export interface Reason {
  code: ReasonCode;
  text?: string;
}

export function validateDeactivationReason(r: Reason): void {
  if (!REASON_CODES.includes(r.code)) {
    throw new RuleViolation("REASON_REQUIRED");
  }
  if (r.code === "otro" && (r.text ?? "").trim() === "") {
    throw new RuleViolation("REASON_REQUIRED");
  }
}
