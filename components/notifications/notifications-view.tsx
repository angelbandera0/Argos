"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markReadAction } from "@/app/(app)/notificaciones/actions";
import { NAV_ICONS } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Pager } from "@/components/ui/pager";
import { Tabs } from "@/components/ui/tabs";
import { ViewState } from "@/components/ui/view-state";
import { NotificationFilterBar } from "./notification-filter-bar";
import { PAGE_SIZE, hasActiveFilters, notificationsQuery, type NotificationFilters } from "./notification-filters-logic";
import { MODULE_META, PRIORITY_META, type NotificationItem } from "./notification-logic";

export type NotificationRowData = NotificationItem & { storeName?: string };
export type NotificationDayGroup = { key: string; label: string; rows: NotificationRowData[] };

const path = "/notificaciones";

function Row({ item, busy, onOpen, onRead }: { item: NotificationRowData; busy: boolean; onOpen: (n: NotificationItem) => void; onRead: (id: string) => void }) {
  const Icon = NAV_ICONS[MODULE_META[item.module].icon];
  const prio = PRIORITY_META[item.priority];
  const PrioIcon = NAV_ICONS[prio.icon];
  return (
    <li className="ui-notif-item" data-unread={!item.read || undefined}>
      <span className="ui-notif-icon" data-urgent={item.priority === "urgent" || undefined} aria-hidden="true">
        <Icon />
      </span>
      <span className="ui-notif-text">
        <strong>{item.title}</strong>
        <span>{item.body}</span>
        <span className="ui-notif-meta">
          <Badge variant={prio.variant} icon={<PrioIcon />}>{prio.label}</Badge>
          <span>{MODULE_META[item.module].label}</span>
          {item.storeName && <span>{item.storeName}</span>}
          <LocalDateTime value={item.createdAt} mode="time" />
        </span>
      </span>
      {!item.read && <span className="ui-notif-dot" role="img" aria-label="Sin leer" />}
      <span className="ui-notif-actions">
        {item.link && <Button variant="outline" size="sm" disabled={busy} onClick={() => onOpen(item)}>Abrir →</Button>}
        {!item.read && (
          <Button variant="ghost" size="sm" disabled={busy} aria-label={`Marcar como leída: ${item.title}`} iconLeft={<NAV_ICONS.Check aria-hidden="true" />} onClick={() => onRead(item.id)} />
        )}
      </span>
    </li>
  );
}

export function NotificationsView({
  groups,
  filters,
  total,
  counts,
  stores,
}: {
  stores: { value: string; label: string }[];
  groups: NotificationDayGroup[];
  filters: NotificationFilters;
  total: number;
  counts: { all: number; unread: number };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (ids?: string[], then?: () => void) =>
    start(async () => {
      if (ids?.length !== 0) await markReadAction(ids).catch(() => {});
      then?.();
      router.refresh();
    });
  const filtered = hasActiveFilters(filters);
  const go = (patch: Partial<NotificationFilters>) => router.push(`${path}${notificationsQuery({ ...filters, page: 1, ...patch })}`);

  return (
    <>
      <div className="ui-notif-toolbar">
        <Tabs
          aria-label="Estado"
          value={filters.read === "unread" ? "unread" : "all"}
          onValueChange={(v) => go({ read: v === "unread" ? "unread" : undefined })}
          items={[
            { value: "all", label: "Todas", count: counts.all },
            { value: "unread", label: "Sin leer", count: counts.unread },
          ]}
        />
        <Button variant="ghost" size="sm" loading={pending} loadingLabel="Marcando…" disabled={counts.unread === 0} onClick={() => run()}>Marcar todas como leídas</Button>
      </div>
      <NotificationFilterBar filters={filters} stores={stores} />
      {groups.length === 0 ? (
        filtered ? (
          <ViewState kind="no-match" entity="notificaciones" action={<Button variant="outline" size="sm" onClick={() => router.replace(path)}>Limpiar filtros</Button>} />
        ) : (
          <ViewState kind="empty" entity="notificaciones" title="Estás al día" text="No tienes notificaciones." />
        )
      ) : (
        groups.map((g) => (
          <section key={g.key} aria-label={g.label}>
            <h2 className="eyebrow">{g.label}</h2>
            <ul className="ui-notif-page-list">
              {g.rows.map((n) => (
                <Row
                  key={n.id}
                  item={n}
                  busy={pending}
                  onRead={(id) => run([id])}
                  onOpen={(item) => run(item.read ? [] : [item.id], () => item.link && router.push(item.link))}
                />
              ))}
            </ul>
          </section>
        ))
      )}
      {total > PAGE_SIZE && <Pager page={filters.page} pageSize={PAGE_SIZE} total={total} unit="notificaciones" onPageChange={(page) => router.push(`${path}${notificationsQuery({ ...filters, page })}`)} />}
    </>
  );
}
