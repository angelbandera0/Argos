import { body, noContent, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const POST = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  await svc(req).orders.registerPurchase(actor, { ...(await body(req, schemas.registerPurchase)), orderId: id });
  return noContent();
});
