import { body, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  return Response.json(await svc(req).stock.previewConsumption(actor, await body(req, schemas.stockPreview)));
});
