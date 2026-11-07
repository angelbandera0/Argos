"use client";

import { Popover } from "@base-ui/react/popover";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { listRecentAction, markReadAction } from "@/app/(app)/notificaciones/actions";
import { NAV_ICONS } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-class";
import { ViewState } from "@/components/ui/view-state";
import { bellCount, bellLabel, MODULE_META, PRIORITY_META, relativeTime, type NotificationItem } from "./notification-logic";
import { useUnreadCount } from "./use-unread-count";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; items: NotificationItem[] };

function Row({ item, now, onOpen }: { item: NotificationItem; now: number; onOpen: (n: NotificationItem) => void }) {
  const Icon = NAV_ICONS[MODULE_META[item.module].icon];
  const prio = PRIORITY_META[item.priority];
  const PrioIcon = NAV_ICONS[prio.icon];
  return (
    <li>
      <button type="button" className="ui-notif-row" data-unread={!item.read || undefined} onClick={() => onOpen(item)}>
        <span className="ui-notif-icon" data-urgent={item.priority === "urgent" || undefined} aria-hidden="true">
          <Icon />
        </span>
        <span className="ui-notif-text">
          <strong>{item.title}</strong>
          <span>{item.body}</span>
          <span className="ui-notif-meta">
            <Badge variant={prio.variant} icon={<PrioIcon />}>
              {prio.label}
            </Badge>
            <span>{MODULE_META[item.module].label}</span>
            <span>{relativeTime(item.createdAt, now)}</span>
          </span>
        </span>
        {!item.read && <span className="ui-notif-dot" role="img" aria-label="Sin leer" />}
      </button>
    </li>
  );
}

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const { count, setCount, refresh } = useUnreadCount(initialCount);
  const [open, setOpen] = useState(false);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [now, setNow] = useState(0);

  const fetchItems = () => {
    setLoad({ status: "loading" });
    setNow(Date.now());
    listRecentAction().then(
      (items) => setLoad({ status: "ready", items }),
      () => setLoad({ status: "error" }),
    );
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      fetchItems();
      void refresh();
    }
  };

  const openItem = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.read) {
      setCount((c) => Math.max(0, c - 1));
      await markReadAction([n.id]).catch(() => {});
      void refresh();
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    await markReadAction().catch(() => {});
    setCount(0);
    setLoad((l) => (l.status === "ready" ? { status: "ready", items: l.items.map((i) => ({ ...i, read: true })) } : l));
  };

  const Bell = NAV_ICONS.Bell;
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger className={buttonClass("icon", "md", "ui-notif-trigger")} aria-label={bellLabel(count)}>
        <Bell aria-hidden="true" />
        {count > 0 && <span className="ui-notif-count" aria-hidden="true">{bellCount(count)}</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className="ui-positioner" align="end" sideOffset={8}>
          <Popover.Popup className="ui-notif-panel" aria-label="Notificaciones">
            <div className="ui-notif-head">
              <Popover.Title render={<h2 />}>Notificaciones</Popover.Title>
              <Button variant="ghost" size="sm" onClick={markAll} disabled={count === 0}>
                Marcar todas como leídas
              </Button>
            </div>
            {count === 0 && load.status === "ready" && load.items.length > 0 && (
              <p className="ui-notif-uptodate" role="status">
                <NAV_ICONS.Check aria-hidden="true" /> Estás al día
              </p>
            )}
            {load.status === "loading" && <ViewState kind="loading" entity="notificaciones" count={3} />}
            {load.status === "error" && (
              <ViewState kind="error" entity="notificaciones" action={<Button variant="outline" size="sm" onClick={fetchItems}>Reintentar</Button>} />
            )}
            {load.status === "ready" && load.items.length === 0 && (
              <ViewState kind="empty" entity="notificaciones" title="Estás al día" text="No tienes notificaciones." />
            )}
            {load.status === "ready" && load.items.length > 0 && (
              <ul className="ui-notif-list">
                {load.items.map((i) => (
                  <Row key={i.id} item={i} now={now} onOpen={openItem} />
                ))}
              </ul>
            )}
            <div className="ui-notif-foot">
              <Link className={buttonClass("outline", "md")} href="/notificaciones" onClick={() => setOpen(false)}>Ver todas</Link>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
