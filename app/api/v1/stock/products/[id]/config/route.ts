import { body, noContent, params, svc } from "../../../../_lib/http";
import { schemas } from "../../../../_lib/schemas";
import { withActor } from "../../../../_lib/with-actor";

export const GET = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return Response.json(await svc(req).stock.getProductStockConfig(actor, { productId: id }));
});

export const PUT = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  await svc(req).stock.saveProductStockConfig(actor, { productId: id, ...(await body(req, schemas.stockConfig)) });
  return noContent();
});
