import { body, created, paginate, query, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

export const GET = withActor(async (req, actor) => {
  const q = query(req);
  const items = await svc(req).catalog.listProducts(actor, {
    companyId: q.get("companyId") ?? undefined,
    onlyActive: q.get("onlyActive") === "true",
  });
  return Response.json(paginate(items, req));
});

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createProduct);
  return created(await svc(req).catalog.createProduct(actor, i));
});
