import Link from "next/link";
import { requireNotifications, toItem } from "@/app/(app)/notificaciones/guard";
import { NAV_ICONS } from "@/components/icons";
import { PRIORITY_META } from "@/components/notifications/notification-logic";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LocalDateTime } from "@/components/ui/local-date-time";

export async function LatestNotifications() {
  const { actor, listNotifications } = await requireNotifications();
  const list = await listNotifications(actor, { pageSize: 10 }).catch(() => null);
  return (
    <Card aria-labelledby="dash-notifs">
      <div className="card-head">
        <h2 className="h2" id="dash-notifs">Últimas 10 notificaciones</h2>
        <span className="spacer" />
        <Link href="/notificaciones">Ver todas →</Link>
      </div>
      {!list ? (
        <EmptyState icon="Bell" title="No se pudieron cargar las notificaciones." />
      ) : list.items.length === 0 ? (
        <EmptyState icon="Bell" title="Estás al día" />
      ) : (
        <ul className="list">
          {list.items.map(toItem).map((n) => {
            const prio = PRIORITY_META[n.priority];
            const Icon = NAV_ICONS[prio.icon];
            return (
              <li key={n.id} className="list-row ui-notif-latest" data-unread={!n.read || undefined}>
                {!n.read && <span className="ui-notif-dot" role="img" aria-label="Sin leer" />}
                <Badge variant={prio.variant} icon={<Icon />}>{prio.label}</Badge>
                <strong>{n.title}</strong>
                <LocalDateTime value={n.createdAt} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
