import { body, created, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  return created(await svc(req).stock.transferStock(actor, await body(req, schemas.stockTransfer)));
});
