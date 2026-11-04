import { body, secret, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";
import { getContainer } from "@/infrastructure/container";

export const GET = withActor(async (req, actor) => Response.json(await svc(req).listAdmins(actor)));

export const POST = withActor(async (req, actor) => {
  const i = await body(req, schemas.createAdmin);
  return secret(await getContainer().createAdmin(actor, i), 201);
});
