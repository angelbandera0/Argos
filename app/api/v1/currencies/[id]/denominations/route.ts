import { body, created, paginate, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const GET = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return Response.json(paginate(await svc(req).currencies.listDenominations(actor, { currencyId: id }), req));
});

export const POST = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.createDenomination);
  return created(await svc(req).currencies.addDenomination(actor, { currencyId: id, ...i }));
});
