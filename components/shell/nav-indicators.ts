import type { SidebarBadge } from "@/components/ui/sidebar-section";
import type { StockStatus } from "@/core/domain/stock";

export function unreadBadge(count: number): SidebarBadge | undefined {
  return count > 0 ? { kind: "alert", text: count > 99 ? "99+" : String(count) } : undefined;
}

export const hasStockAlert = (counts: Record<StockStatus, number>[]) => counts.some((c) => c.low + c.out > 0);
