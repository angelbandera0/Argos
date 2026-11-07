import { ArrowLeft, Check, CircleAlert, Clock, Minus, Pencil, Search, ShoppingBag, X } from "lucide-react";

type Tone = "ok" | "warn" | "out" | "draft" | "open" | "ring" | "muted";
type Def = { label: string; icon: React.ElementType; tone: Tone };

export const STATUS_BADGES = {
  stock: {
    normal: { label: "Normal", icon: Check, tone: "ok" },
    low: { label: "Bajo", icon: CircleAlert, tone: "warn" },
    out: { label: "Agotado", icon: X, tone: "out" },
  },
  line: {
    pending: { label: "Pendiente", icon: Clock, tone: "draft" },
    filled: { label: "Surtida", icon: Check, tone: "ok" },
    partial: { label: "Surtida en parte", icon: Minus, tone: "warn" },
    toBuy: { label: "Por comprar", icon: ShoppingBag, tone: "ring" },
    rejected: { label: "Rechazada", icon: X, tone: "out" },
  },
  request: {
    unattended: { label: "Sin atender", icon: Clock, tone: "open" },
    partial: { label: "Atendida en parte", icon: Minus, tone: "warn" },
    filled: { label: "Surtida", icon: Check, tone: "ok" },
  },
  order: {
    draft: { label: "Borrador", icon: Pencil, tone: "draft" },
    open: { label: "Abierto · en curso", icon: Clock, tone: "open" },
    review: { label: "En revisión", icon: Search, tone: "ring" },
    returned: { label: "Devuelto", icon: ArrowLeft, tone: "out" },
    done: { label: "Cumplido", icon: Check, tone: "ok" },
    cancelled: { label: "Cancelado", icon: X, tone: "muted" },
  },
} satisfies Record<string, Record<string, Def>>;

type Families = typeof STATUS_BADGES;
export type StatusBadgeProps = { [F in keyof Families]: { family: F; status: keyof Families[F] } }[keyof Families];

export function StatusBadge({ family, status }: StatusBadgeProps) {
  const { label, icon: Icon, tone } = (STATUS_BADGES[family] as Record<string, Def>)[status as string];
  return (
    <span className={`ui-status-badge ui-status-${tone}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  );
}
