import { params, query, svc } from "../../_lib/http";
import { withActor } from "../../_lib/with-actor";

export const GET = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return Response.json(await svc(req).requests.getRequest(actor, { companyId: query(req).get("companyId") ?? undefined, requestId: id }));
});
