import { query, svc } from "../_lib/http";
import { withActor } from "../_lib/with-actor";

const num = (v: string | null) => (v === null ? undefined : Number(v));

export const GET = withActor(async (req, actor) => {
  const q = query(req);
  const get = (k: string) => q.get(k) ?? undefined;
  const { items, total } = await svc(req).notifications.listNotifications(actor, {
    module: get("module"),
    operation: get("operation"),
    priority: get("priority"),
    read: get("read"),
    storeId: get("storeId"),
    from: get("from"),
    to: get("to"),
    page: num(q.get("page")),
    pageSize: num(q.get("pageSize")),
  });
  return Response.json({ items, total });
});
