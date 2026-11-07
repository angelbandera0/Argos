import { body, noContent, params, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.updateRole);
  return Response.json(await svc(req).roles.updateRole(actor, id, i));
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  await svc(req).roles.deleteRole(actor, id);
  return noContent();
});
