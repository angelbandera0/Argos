import { body, created, paginate, query, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

export const GET = withActor(async (req, actor) => {
  const companyId = query(req).get("companyId") ?? undefined;
  return Response.json(paginate(await svc(req).catalog.listCategories(actor, { companyId }), req));
});

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createCategory);
  return created(await svc(req).catalog.createCategory(actor, i));
});
