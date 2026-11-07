import { body, created, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  const movementId = await svc(req).stock.adjustLot(actor, await body(req, schemas.stockAdjustment));
  return created({ movementId });
});
