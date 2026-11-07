import { body, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const POST = withActor(async (req, actor) => {
  const text = await req.clone().text();
  const { ids } = text ? await body(req, schemas.markNotificationsRead) : { ids: undefined };
  return Response.json({ updated: await svc(req).notifications.markNotificationsRead(actor, { ids }) });
});
