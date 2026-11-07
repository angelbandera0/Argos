import { Button } from "@/components/ui/button";
import { NAV_ICONS } from "@/components/icons";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeNotifications } from "@/infrastructure/supabase/notifications-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { NotificationBell } from "./notification-bell";

export function BellFallback() {
  return (
    <Button variant="icon" aria-label="Notificaciones" disabled>
      <NAV_ICONS.Bell aria-hidden="true" />
    </Button>
  );
}

export async function BellSlot() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims) return <BellFallback />;
  const count = await makeNotifications(supabase)
    .countUnreadNotifications({ userId: claims.userId, kind: claims.kind, channel: "ui" })
    .catch(() => 0);
  return <NotificationBell initialCount={count} />;
}
