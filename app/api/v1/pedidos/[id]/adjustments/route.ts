import { body, created, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const POST = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return created({ id: await svc(req).orders.adjustOrder(actor, { ...(await body(req, schemas.adjustOrder)), orderId: id }) });
});
