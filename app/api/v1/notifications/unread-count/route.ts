import { svc } from "../../_lib/http";
import { withActor } from "../../_lib/with-actor";

export const GET = withActor(async (req, actor) =>
  Response.json({ count: await svc(req).notifications.countUnreadNotifications(actor) }),
);
