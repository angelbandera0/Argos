import { notFound } from "next/navigation";
import { toAuditRow, toAuthRow } from "@/components/history/audit-rows";
import { HistoryFilterBar } from "@/components/history/history-filters";
import { HistoryPager } from "@/components/history/history-pager";
import { HistoryTabs, type HistoryTabItem } from "@/components/history/history-tabs";
import { ACTIONS, ACTION_KEYS, AUTH_EVENTS, AUTH_EVENT_KEYS, HISTORY_MODULES, hasActiveFilters, parseHistoryParams } from "@/components/history/history-utils";
import { groupByDay, rangeToInstants } from "@/components/history/time-zone";
import { Alert } from "@/components/ui/alert";
import { AuditTable } from "@/components/ui/audit-table";
import { EmptyState } from "@/components/ui/empty-state";
import { actorNames, requireAccessAdmin, requireHistoryUser, userTimeZone } from "./guard";

/** H-01 (`todos` or a module) and H-02 (`accesos`): tabs with counters, filter bar and the table grouped by day. */
export async function HistoryScreen({ section, searchParams }: { section: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = section === "accesos";
  const { actor, history, users, companyId, isAdmin, modules } = access ? await requireAccessAdmin() : await requireHistoryUser();
  if (!access && (section === "todos" ? modules.length === 0 : !modules.includes(section))) notFound();
  if (actor.kind === "admin" && !companyId) {
    return <EmptyState icon={access ? "ShieldCheck" : "History"} title={`Elige una compañía arriba para ver ${access ? "sus accesos" : "su historial"}.`} />;
  }

  const { filters, invalidDates } = parseHistoryParams(await searchParams, access ? AUTH_EVENT_KEYS : ACTION_KEYS);
  const { tz, assumed } = await userTimeZone();
  const range = rangeToInstants(filters.from, filters.to, tz);
  const people = await actorNames(users, companyId);
  const names = new Map(people.map((u) => [u.id, u.displayName]));
  const scope = { companyId, channel: filters.channel, ...range };

  const [list, counts, accessCount] = await Promise.all([
    (access
      ? history
          .listAuthEvents(actor, { ...scope, userId: filters.actor, events: filters.actions, cursor: filters.cursor })
          .then((p) => ({ rows: p.items.map((e) => toAuthRow(e, names)), next: p.nextCursor }))
      : history
          .listHistory(actor, {
            ...scope,
            actorId: filters.actor,
            actions: filters.actions,
            cursor: filters.cursor,
            ...(section === "todos" ? { modules: isAdmin ? undefined : modules } : { module: section }),
          })
          .then((p) => ({ rows: p.items.map((e) => toAuditRow(e, names, tz)), next: p.nextCursor }))
    ).catch(() => null),
    history.countHistory(actor, { ...scope, actorId: filters.actor, actions: filters.actions, modules: isAdmin ? Object.keys(HISTORY_MODULES) : modules }).catch(() => null),
    isAdmin
      ? history.countAuthEvents(actor, { ...scope, userId: filters.actor, events: access ? filters.actions : undefined }).catch(() => undefined)
      : undefined,
  ]);
  if (!list) return <Alert variant="danger">No se pudo cargar el historial. Inténtalo de nuevo.</Alert>;

  const tabs: HistoryTabItem[] = [
    ...(modules.length > 1 ? [{ value: "todos", label: "Todos", count: counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined }] : []),
    ...modules.map((m) => ({ value: m, label: HISTORY_MODULES[m] ?? m, count: counts?.[m] })),
    ...(isAdmin ? [{ value: "accesos", label: "Accesos", count: accessCount }] : []),
  ];

  const { rows, next } = list;
  const groups = groupByDay(rows, tz);
  const options = Object.entries(access ? AUTH_EVENTS : ACTIONS).map(([value, v]) => ({ value, label: v.label }));
  const path = `/historial/${section}`;
  const filtered = hasActiveFilters(filters);
  const nouns: [string, string] = access ? ["evento", "eventos"] : ["operación", "operaciones"];

  return (
    <div className="stack">
      {invalidDates && <Alert variant="warning" compact>Se ignoró una fecha del filtro porque no es válida.</Alert>}
      {assumed && <Alert variant="info" compact>No pudimos detectar tu zona horaria: los días se agrupan en UTC.</Alert>}
      {tabs.length > 1 && <HistoryTabs items={tabs} current={section} filters={filters} />}
      <HistoryFilterBar
        path={path}
        filters={filters}
        people={isAdmin ? people.map((u) => ({ value: u.id, label: u.displayName })) : []}
        actionOptions={options}
        actionLabel={access ? "Evento" : "Acción"}
      />
      <AuditTable
        label={access ? "Eventos de acceso" : "Historial de operaciones"}
        groups={groups}
        showModule={section === "todos"}
        showEntity={!access}
        actionHeader={access ? "Evento" : "Acción"}
        nouns={nouns}
        empty={
          filtered ? (
            <EmptyState icon="Search" title={`Ningún${access ? " evento" : "a operación"} coincide con los filtros.`}>
              Prueba con otros filtros o límpialos.
            </EmptyState>
          ) : (
            <EmptyState icon={access ? "ShieldCheck" : "History"} title={access ? "Aún no hay eventos de acceso." : "Aún no hay operaciones registradas."} />
          )
        }
        footer={
          rows.length > 0 || filters.prev.length > 0 ? (
            <>
              <span>
                {rows.length} {rows.length === 1 ? nouns[0] : nouns[1]} en esta página
              </span>
              <HistoryPager path={path} filters={filters} nextCursor={next} />
            </>
          ) : undefined
        }
      />
    </div>
  );
}
