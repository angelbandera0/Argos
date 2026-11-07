import { body, noContent, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const POST = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.grantAccess);
  await svc(req).org.grantAccess(actor, { companyId: id, adminId: i.adminId });
  return noContent();
});
