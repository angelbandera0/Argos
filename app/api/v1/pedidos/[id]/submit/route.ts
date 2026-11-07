import { params, query, svc } from "../../../_lib/http";
import { withActor } from "../../../_lib/with-actor";

export const POST = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return Response.json(await svc(req).orders.submitReview(actor, { companyId: query(req).get("companyId") ?? undefined, orderId: id }));
});
