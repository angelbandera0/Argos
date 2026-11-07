import { query, svc } from "../../_lib/http";
import { withActor } from "../../_lib/with-actor";

export const GET = withActor(async (req, actor) => {
  const items = await svc(req).stock.listLocations(actor, { companyId: query(req).get("companyId") ?? undefined });
  return Response.json({ items });
});
