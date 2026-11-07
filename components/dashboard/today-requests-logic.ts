import type { RequestStatus } from "@/core/domain/requests";

/** [from, to) ISO range of the server's local calendar day (the company has no timezone setting yet). */
export function dayRange(now: Date): { createdFrom: string; createdTo: string } {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { createdFrom: from.toISOString(), createdTo: to.toISOString() };
}

export const STATUS_ORDER: { status: RequestStatus; label: string }[] = [
  { status: "new", label: "Sin atender" },
  { status: "in_progress", label: "En proceso" },
  { status: "to_buy", label: "Por comprar" },
  { status: "pending", label: "Pendientes" },
  { status: "fulfilled", label: "Atendidas" },
  { status: "rejected", label: "Rechazadas" },
];
