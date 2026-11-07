import { body, created, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createSite);
  return created(await svc(req).org.createSite(actor, i));
});
