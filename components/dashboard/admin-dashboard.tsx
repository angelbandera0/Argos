import { History, Lock, LockOpen } from "@/components/icons";
import { Building2, Store, Box, Users, KeyRound, Tags, UserPlus } from "@/components/icons";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { adminDemo } from "@/app/(app)/_demo/dashboard-data";
import { AnalyticsCard } from "./analytics-card";

const ICONS = { Building2, Store, Box, Users, KeyRound, Tags, UserPlus, Lock };

export function AdminDashboard({ today }: { today: number }) {
  const d = adminDemo;
  return (
    <>
      <ul className="meters" aria-label="Estado de la organización (datos de ejemplo)">
        {d.meters.map((m) => (
          <li key={m.id} className="meter-item">
            <span className="eyebrow">{m.label} · {m.detail}</span>
            <span className="pill-track" role="img" aria-label={`${m.label}: ${m.percent} %, ${m.detail}`}>
              <span className={`pill-fill pill-${m.tone}`} style={{ width: `${m.percent}%` }}>{m.percent}%</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="dash-grid">
        <Card aria-labelledby="dash-inv">
          <h2 className="h2" id="dash-inv">Tu organización</h2>
          <ul className="list">
            {d.counts.map((c) => {
              const Icon = ICONS[c.icon];
              return (
                <li key={c.id} className="list-row admin-row">
                  <span className="icon-dot" aria-hidden="true"><Icon /></span>
                  <span>{c.label}</span>
                  <strong className="count">{c.value}</strong>
                </li>
              );
            })}
          </ul>
        </Card>
        <AnalyticsCard series={d.series} today={today} />
        <Card aria-labelledby="dash-blocked">
          <div className="card-head">
            <h2 className="h2" id="dash-blocked">Usuarios por atender</h2>
            <span className="spacer" />
            <Chip variant="alert">{d.blocked.length} PENDIENTES</Chip>
          </div>
          {d.blocked.length === 0 ? (
            <EmptyState icon="Users" title="No hay usuarios por atender." />
          ) : (
          <ul className="list">
            {d.blocked.map((u) => (
              <li key={u.id} className="list-row admin-row">
                <span className="icon-dot" aria-hidden="true">{u.state === "Bloqueado" ? <Lock /> : <LockOpen />}</span>
                <span className="store-info">
                  <strong>{u.name}</strong>
                  <span className="caption">{u.place} · {u.note}</span>
                </span>
                <Badge variant={u.state === "Bloqueado" ? "danger" : "warning"}>{u.state}</Badge>
              </li>
            ))}
          </ul>
          )}
        </Card>
        <Card aria-labelledby="dash-activity">
          <div className="card-head">
            <h2 className="h2" id="dash-activity">Actividad reciente</h2>
            <span className="spacer" />
            <History aria-hidden="true" className="muted-icon" />
          </div>
          <ul className="list">
            {d.activity.map((e) => {
              const Icon = ICONS[e.icon];
              return (
                <li key={e.id} className="list-row admin-row">
                  <span className="icon-dot dot-yellow" aria-hidden="true"><Icon /></span>
                  <span className="store-info">
                    <strong>{e.text}</strong>
                    <span className="caption">{e.who}</span>
                  </span>
                  <span className="caption">{e.when}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card aria-labelledby="dash-companies">
          <h2 className="h2" id="dash-companies">Resumen por compañía</h2>
          <Accordion
            items={d.companies.map((c) => ({
              value: c.id,
              title: c.name,
              badge: <Badge variant={c.active ? "success" : "neutral"}>{c.active ? "Activa" : "Desactivada"}</Badge>,
              content: (
                <dl className="facts">
                  <div><dt className="eyebrow">Sedes</dt><dd>{c.sites}</dd></div>
                  <div><dt className="eyebrow">Tiendas</dt><dd>{c.stores}</dd></div>
                  <div><dt className="eyebrow">Usuarios</dt><dd>{c.users}</dd></div>
                </dl>
              ),
            }))}
          />
        </Card>
      </div>
    </>
  );
}
