import { body, created, params, svc } from "../../../../_lib/http";
import { schemas } from "../../../../_lib/schemas";
import { withActor } from "../../../../_lib/with-actor";

export const POST = withActor(async (req, actor, ctx) => {
  const { lineId } = await params<{ id: string; lineId: string }>(ctx);
  const input = await body(req, schemas.attendRequestLine);
  return created({ id: await svc(req).requests.attendRequestLine(actor, { ...input, lineId }) });
});
