import { body, noContent, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const PUT = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  await svc(req).orders.saveReview(actor, { ...(await body(req, schemas.saveOrderReview)), orderId: id });
  return noContent();
});
