import Link from "next/link";
import { requireRequestUser } from "@/app/(app)/solicitudes/guard";
import { requestBadge } from "@/components/requests/request-logic";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { countByStatus, dayRange } from "./today-requests-logic";

/** Handlers/admins see every store's requests; store users only their own (the use case scopes). */
export async function TodayRequests() {
  const { actor, requests, companyId } = await requireRequestUser();
  if (!companyId) return null;
  const list = await requests.listRequests(actor, { companyId, ...dayRange(new Date()), pageSize: 100 }).catch(() => undefined);
  if (list === undefined) return null;
  const counts = countByStatus(list.items);
  return (
    <Card aria-labelledby="dash-requests">
      <div className="card-head">
        <h2 className="h2" id="dash-requests">Solicitudes del día</h2>
        <span className="spacer" />
        <Link href="/solicitudes">Ver solicitudes →</Link>
      </div>
      {list.items.length === 0 ? (
        <EmptyState icon="Bell" title="Hoy no hay solicitudes" />
      ) : (
        <>
          <div className="ui-stat-grid">
            {counts.map((c) => (
              <StatTile key={c.status} label={c.label} value={c.count} />
            ))}
          </div>
          <ul className="list">
            {list.items.slice(0, 5).map((r) => (
              <li key={r.id} className="list-row">
                <StatusBadge {...requestBadge(r.status)} />
                <Link href={`/solicitudes/${r.id}`}>{r.storeName}</Link>
                <LocalDateTime value={r.createdAt} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
