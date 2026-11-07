import { groupByDay } from "@/components/history/time-zone";
import { NotificationsError } from "@/components/notifications/notifications-error";
import { toListInput, parseNotificationParams } from "@/components/notifications/notification-filters-logic";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { Alert } from "@/components/ui/alert";
import { userTimeZone } from "../historial/guard";
import { requireNotifications, toItem } from "./guard";

export async function NotificationsScreen({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { actor, supabase, listNotifications } = await requireNotifications();
  const filters = parseNotificationParams(await searchParams);
  const { tz, assumed } = await userTimeZone();
  const count = (read?: "unread") => listNotifications(actor, toListInput({ ...filters, read }, tz, { page: 1, pageSize: 1 })).then((r) => r.total);
  const [list, all, unread, storeRows] = await Promise.all([
    listNotifications(actor, toListInput(filters, tz)).catch(() => null),
    count().catch(() => 0),
    count("unread").catch(() => 0),
    supabase.from("stores").select("id, name").order("name").then((r) => r.data ?? [], () => []),
  ]);
  if (!list) return <NotificationsError />;

  const names = new Map(storeRows.map((s: { id: string; name: string }) => [s.id, s.name]));
  const rows = list.items.map((n) => ({ ...toItem(n), storeName: n.storeId ? names.get(n.storeId) : undefined }));
  return (
    <>
      {assumed && <Alert variant="info" compact>No pudimos detectar tu zona horaria: los días se agrupan en UTC.</Alert>}
      <NotificationsView
        groups={groupByDay(rows, tz)}
        filters={filters}
        total={list.total}
        counts={{ all, unread }}
        stores={storeRows.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }))}
      />
    </>
  );
}
