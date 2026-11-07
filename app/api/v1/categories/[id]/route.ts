import { body, noContent, params, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.name);
  await svc(req).catalog.renameCategory(actor, { id, name: i.name });
  return noContent();
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  await svc(req).catalog.deleteCategory(actor, { id });
  return noContent();
});
