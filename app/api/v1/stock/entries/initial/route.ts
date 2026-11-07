import { body, created, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  const lotId = await svc(req).stock.registerInitialEntry(actor, await body(req, schemas.stockEntry));
  return created({ lotId });
});
