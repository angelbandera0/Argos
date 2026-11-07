import { body, created, params, svc } from "../../../../_lib/http";
import { schemas } from "../../../../_lib/schemas";
import { withActor } from "../../../../_lib/with-actor";

export const POST = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return created(await svc(req).stock.addMovementUnit(actor, { productId: id, ...(await body(req, schemas.createMovementUnit)) }));
});
