import { body, noContent, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const PUT = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.assignStores);
  await svc(req).users.assignStores(actor, { userId: id, assignments: i.assignments });
  return noContent();
});
