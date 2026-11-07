import Link from "next/link";
import { requireRequestUser } from "@/app/(app)/solicitudes/guard";
import { requestBadge } from "@/components/requests/request-logic";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATUS_ORDER, dayRange } from "./today-requests-logic";

/** Handlers/admins see every store's requests; store users only their own (the use case scopes). */
export async function TodayRequests() {
  const { actor, requests, companyId, canHandle } = await requireRequestUser();
  if (!companyId) return null;
  const day = { companyId, ...dayRange(new Date()) };
  const [list, perStatus] = await Promise.all([
    requests.listRequests(actor, { ...day, pageSize: 5 }).catch(() => undefined),
    Promise.all(STATUS_ORDER.map((s) => requests.listRequests(actor, { ...day, status: s.status, pageSize: 1 }).then((r) => ({ ...s, count: r.total })).catch(() => ({ ...s, count: 0 })))),
  ]);
  if (list === undefined) return null;
  const counts = perStatus.filter((c) => c.count > 0);
  return (
    <Card aria-labelledby="dash-requests">
      <div className="card-head">
        <h2 className="h2" id="dash-requests">Solicitudes del día</h2>
        <span className="spacer" />
        {canHandle && <Link href="/solicitudes/bandeja">Bandeja →</Link>}
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
            {list.items.map((r) => (
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
