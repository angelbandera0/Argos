import { noContent, params, svc } from "../../../../_lib/http";
import { withActor } from "../../../../_lib/with-actor";

export const DELETE = withActor(async (req, actor, ctx) => {
  const { id, adminId } = await params<{ id: string; adminId: string }>(ctx);
  await svc(req).org.revokeAccess(actor, { companyId: id, adminId });
  return noContent();
});
