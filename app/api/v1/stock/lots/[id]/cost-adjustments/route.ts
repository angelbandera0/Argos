import { body, created, params, svc } from "../../../../_lib/http";
import { schemas } from "../../../../_lib/schemas";
import { withActor } from "../../../../_lib/with-actor";

export const GET = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return Response.json({ items: await svc(req).stock.listLotCostAdjustments(actor, { lotId: id }) });
});

export const POST = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const adjustmentId = await svc(req).stock.adjustLotCost(actor, { lotId: id, ...(await body(req, schemas.stockCostAdjustment)) });
  return created({ adjustmentId });
});
