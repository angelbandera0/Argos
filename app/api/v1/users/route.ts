import { body, secret, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createOperator);
  return secret(await svc(req).users.createOperator(actor, i), 201);
});
