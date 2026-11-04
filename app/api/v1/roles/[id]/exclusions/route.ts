import { body, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const PUT = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.exclusions);
  return Response.json(await svc(req).roles.setExclusions(actor, { roleId: id, companyIds: i.companyIds }));
});
