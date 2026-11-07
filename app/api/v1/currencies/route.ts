import { body, created, paginate, query, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

export const GET = withActor(async (req, actor) => {
  const q = query(req);
  const active = q.get("active");
  const items = await svc(req).currencies.listCurrencies(actor, {
    companyId: q.get("companyId") ?? undefined,
    active: active === null ? undefined : active === "true",
    search: q.get("q") ?? undefined,
  });
  return Response.json(paginate(items, req));
});

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createCurrency);
  return created(await svc(req).currencies.createCurrency(actor, i));
});
