import { Box, Clock, Store } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { operatorDemo } from "@/app/(app)/_demo/dashboard-data";

export function OperatorDashboard() {
  const { store, session, access } = operatorDemo;
  return (
    <div className="dash-grid">
      <Card aria-labelledby="op-store">
        <div className="card-head">
          <span className="icon-dot" aria-hidden="true"><Store /></span>
          <span className="spacer" />
          <Chip variant="open">EN TURNO</Chip>
        </div>
        <span className="eyebrow">Tienda activa</span>
        <h2 className="h2" id="op-store">{store.name}</h2>
        <p className="caption">{store.site} · {store.company}</p>
      </Card>
      <Card aria-labelledby="op-session">
        <div className="card-head">
          <span className="icon-dot" aria-hidden="true"><Clock /></span>
        </div>
        <span className="eyebrow">Tu sesión termina a las</span>
        <p className="stat" id="op-session">{session.endsAt}</p>
        <p className="caption">Te quedan {session.remaining}.</p>
      </Card>
      <Card aria-labelledby="op-access">
        <h2 className="h2" id="op-access">Tus accesos</h2>
        <ul className="list">
          {access.map((a) => (
            <li key={a.id} className="list-row admin-row">
              <span className="icon-dot dot-yellow" aria-hidden="true"><Box /></span>
              <strong>{a.label}</strong>
              <span className="caption">{a.detail}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
