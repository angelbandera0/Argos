import type { NotificationModule, NotificationPriority } from "@/core/domain/notification";
import type { NavIconName } from "@/components/icons";
import type { BadgeVariant } from "@/components/ui/feedback-utils";

export interface NotificationItem {
  id: string;
  module: NotificationModule;
  priority: NotificationPriority;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  read: boolean;
}

export const bellCount = (n: number) => (n > 9 ? "9+" : String(n));

export const bellLabel = (n: number) =>
  n === 0 ? "Notificaciones, sin leer" : `Notificaciones, ${n} sin leer`;

export const MODULE_META: Record<NotificationModule, { label: string; icon: NavIconName }> = {
  products: { label: "Productos", icon: "Box" },
  currencies: { label: "Divisas", icon: "Coins" },
  stock: { label: "Inventario", icon: "Box" },
  requests: { label: "Solicitudes", icon: "Inbox" },
  orders: { label: "Pedidos", icon: "Box" },
  roles: { label: "Roles", icon: "KeyRound" },
  users: { label: "Usuarios", icon: "Users" },
  organization: { label: "Organización", icon: "Building2" },
  system: { label: "Sistema", icon: "Settings" },
};

export const PRIORITY_META: Record<NotificationPriority, { label: string; icon: NavIconName; variant: BadgeVariant }> = {
  info: { label: "Info", icon: "Info", variant: "neutral" },
  warning: { label: "Aviso", icon: "TriangleAlert", variant: "warning" },
  urgent: { label: "Urgente", icon: "CircleAlert", variant: "danger" },
};

export function relativeTime(iso: string, now: number): string {
  const min = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d < 7 ? `hace ${d} d` : new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(iso));
}
