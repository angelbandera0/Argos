import { query, svc } from "../_lib/http";
import { withActor } from "../_lib/with-actor";

const get = (q: URLSearchParams) => (k: string) => q.get(k) ?? undefined;
const num = (v: string | undefined) => (v === undefined ? undefined : Number(v));

export const GET = withActor(async (req, actor) => {
  const g = get(query(req));
  const out = await svc(req).stock.listStockStatus(actor, {
    companyId: g("companyId"),
    locationId: g("locationId") ?? "",
    status: g("status"),
    q: g("q"),
    categoryId: g("categoryId"),
    page: num(g("page")),
    pageSize: num(g("pageSize")),
  });
  return Response.json(out);
});
