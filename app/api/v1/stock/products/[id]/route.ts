import { params, query, svc } from "../../../_lib/http";
import { withActor } from "../../../_lib/with-actor";

export const GET = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const q = query(req);
  const only = q.get("onlyAvailable");
  const out = await svc(req).stock.getProductStock(actor, {
    productId: id,
    locationId: q.get("locationId") ?? "",
    onlyAvailable: only === null ? undefined : only === "true",
  });
  return Response.json(out);
});
