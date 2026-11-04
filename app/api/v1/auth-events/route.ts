import { historyQuery, svc } from "../_lib/http";
import { withActor } from "../_lib/with-actor";

export const GET = withActor(async (req, actor) => {
  const { list, q, ...f } = historyQuery(req);
  return Response.json(
    await svc(req).history.listAuthEvents(actor, {
      ...f,
      userId: q.get("userId") ?? undefined,
      events: list(q.get("events")),
    }),
  );
});
