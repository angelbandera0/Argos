import { body, noContent, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.changeRole);
  await svc(req).users.changeOperatorRole(actor, { userId: id, storeId: i.storeId, roleId: i.roleId });
  return noContent();
});
