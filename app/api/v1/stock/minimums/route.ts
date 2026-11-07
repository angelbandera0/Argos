import { body, noContent, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const PUT = withActor(async (req, actor) => {
  const { productId, locationId, minimum } = await body(req, schemas.setMinimum);
  const stock = svc(req).stock;
  if (minimum) await stock.setMinimum(actor, { productId, locationId, minimum });
  else await stock.clearMinimum(actor, { productId, locationId });
  return noContent();
});
