import type { ReasonCode } from "@/core/domain/deactivation";

export const REASON_LABELS: Record<ReasonCode, string> = {
  "cierre-definitivo": "Cierre definitivo",
  "cierre-temporal": "Cierre temporal",
  reestructuracion: "Reestructuración",
  remodelacion: "Remodelación",
  "creada-por-error": "Creada por error",
  "fin-de-contrato": "Fin de contrato o acuerdo",
  otro: "Otro",
};
