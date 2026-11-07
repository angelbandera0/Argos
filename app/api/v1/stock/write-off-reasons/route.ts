import { body, created, query, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const GET = withActor(async (req, actor) => {
  const items = await svc(req).stock.listWriteOffReasons(actor, { companyId: query(req).get("companyId") ?? undefined });
  return Response.json({ items });
});

export const POST = withActor(async (req, actor) => {
  return created(await svc(req).stock.createWriteOffReason(actor, await body(req, schemas.createWriteOffReason)));
});
