import { Suspense, type ReactNode } from "react";
import { requireStockUser } from "@/app/(app)/existencias/guard";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeNotifications } from "@/infrastructure/supabase/notifications-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { hasStockAlert, unreadBadge } from "./nav-indicators";

async function UnreadCount() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims) return null;
  const count = await makeNotifications(supabase)
    .countUnreadNotifications({ userId: claims.userId, kind: claims.kind, channel: "ui" })
    .catch(() => 0);
  const badge = unreadBadge(count);
  return badge ? <b className={`nav-badge nav-badge-${badge.kind}`}>{badge.text}</b> : null;
}

async function StockDot() {
  const { actor, stock, companyId } = await requireStockUser();
  if (!companyId) return null;
  const counts = await (async () => {
    const locations = await stock.listLocations(actor, { companyId });
    return Promise.all(locations.map((l) => stock.listStockStatus(actor, { companyId, locationId: l.id, pageSize: 1 }).then((r) => r.counts)));
  })().catch(() => []);
  return hasStockAlert(counts) ? <i className="nav-dot" aria-hidden="true" /> : null;
}

/** Indicators by nav item id; each streams under its own Suspense so the shell never waits for them. */
export const NAV_SLOTS: Record<string, ReactNode> = {
  notificaciones: (
    <Suspense fallback={null}>
      <UnreadCount />
    </Suspense>
  ),
  existencias: (
    <Suspense fallback={null}>
      <StockDot />
    </Suspense>
  ),
};
