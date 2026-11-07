import { dayBoundsInTimeZone, dayKey } from "@/components/history/time-zone";
import type { RequestStatus } from "@/core/domain/requests";

/** [from, to) ISO range of the current calendar day in the company time zone. */
export function dayRange(now: Date, tz: string): { createdFrom: string; createdTo: string } {
  const { start, end } = dayBoundsInTimeZone(dayKey(now, tz), tz);
  return { createdFrom: start.toISOString(), createdTo: end.toISOString() };
}

export const STATUS_ORDER: { status: RequestStatus; label: string }[] = [
  { status: "new", label: "Sin atender" },
  { status: "in_progress", label: "En proceso" },
  { status: "to_buy", label: "Por comprar" },
  { status: "pending", label: "Pendientes" },
  { status: "fulfilled", label: "Atendidas" },
  { status: "rejected", label: "Rechazadas" },
];
