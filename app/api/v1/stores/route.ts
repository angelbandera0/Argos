import { body, created, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createStore);
  return created(await svc(req).org.createStore(actor, i));
});
