import { body, created, paginate, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

export const GET = withActor(async (req, actor) =>
  Response.json(paginate(await svc(req).roles.listRoles(actor), req)),
);

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createRole);
  return created(await svc(req).roles.createRole(actor, i));
});
