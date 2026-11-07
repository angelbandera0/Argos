import { query, svc } from "../../_lib/http";
import { withActor } from "../../_lib/with-actor";

const get = (q: URLSearchParams) => (k: string) => q.get(k) ?? undefined;
const num = (v: string | undefined) => (v === undefined ? undefined : Number(v));

export const GET = withActor(async (req, actor) => {
  const g = get(query(req));
  const out = await svc(req).stock.listMovements(actor, {
    companyId: g("companyId"),
    productId: g("productId"),
    locationId: g("locationId"),
    type: g("type"),
    from: g("from"),
    to: g("to"),
    page: num(g("page")),
    pageSize: num(g("pageSize")),
  });
  return Response.json(out);
});
