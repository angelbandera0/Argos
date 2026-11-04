import { historyQuery, params, svc } from "../../_lib/http";
import { withActor } from "../../_lib/with-actor";

export const GET = withActor(async (req, actor, ctx) => {
  const { module } = await params<{ module: string }>(ctx);
  const { list, q, ...f } = historyQuery(req);
  return Response.json(
    await svc(req).history.listHistory(actor, {
      ...f,
      module,
      actorId: q.get("actorId") ?? undefined,
      actions: list(q.get("actions")),
    }),
  );
});
