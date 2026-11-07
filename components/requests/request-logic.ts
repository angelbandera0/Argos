import { z } from "zod";
import type { LineStatus, RequestStatus } from "@/core/domain/requests";
import type { StatusBadgeProps } from "@/components/ui/status-badge";

const amount = z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v), z.number().finite().positive());

export const requestSchema = z.object({
  storeId: z.string().optional(),
  note: z.string().max(500),
  lines: z
    .array(z.object({ productId: z.string().min(1), qty: amount, unit: z.string().min(1) }))
    .min(1)
    .max(200),
});

export function parseLines(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Elige al menos un producto y escribe cantidades mayores que cero.",
  EMPTY_REQUEST: "Elige al menos un producto.",
  DUPLICATE_PRODUCT: "Un producto aparece dos veces. Déjalo una sola vez.",
  INVALID_QUANTITY: "Escribe cantidades mayores que cero.",
  INVALID_UNIT: "Elige la unidad de cada producto.",
};

export const requestErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo enviar la solicitud. Inténtalo de nuevo.";

/** Missing amount to reach the minimum, as the suggested request quantity ("" when none). */
export function suggestedAmount(quantity: number, minimum: number | null): string {
  if (!minimum || quantity >= minimum) return "";
  return String(Math.round((minimum - quantity) * 1000) / 1000).replace(".", ",");
}

export function requestBadge(s: RequestStatus): StatusBadgeProps {
  switch (s) {
    case "new":
      return { family: "request", status: "unattended" };
    case "in_progress":
      return { family: "request", status: "partial" };
    case "fulfilled":
      return { family: "request", status: "filled" };
    case "to_buy":
      return { family: "line", status: "toBuy" };
    case "pending":
      return { family: "line", status: "pending" };
    case "rejected":
      return { family: "line", status: "rejected" };
  }
}

export function lineBadge(s: LineStatus): StatusBadgeProps {
  const status = { new: "pending", in_progress: "partial", fulfilled: "filled", to_buy: "toBuy", pending: "pending", rejected: "rejected" } as const;
  return { family: "line", status: status[s] };
}

export function usedProducts(lines: { productId: string }[]): Set<string> {
  return new Set(lines.map((l) => l.productId).filter(Boolean));
}
