import { body, noContent, params, svc } from "../../../../../_lib/http";
import { schemas } from "../../../../../_lib/schemas";
import { withActor } from "../../../../../_lib/with-actor";

type Ctx = { id: string; presentationId: string };

export const PATCH = withActor(async (req, actor, ctx) => {
  const p = await params<Ctx>(ctx);
  const { active, ...changes } = await body(req, schemas.updatePresentation);
  const stock = svc(req).stock;
  const ref = { productId: p.id, id: p.presentationId };
  if (Object.keys(changes).length) await stock.updatePresentation(actor, { ...ref, ...changes });
  if (active !== undefined) await stock.setPresentationActive(actor, { ...ref, active });
  return noContent();
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const p = await params<Ctx>(ctx);
  await svc(req).stock.deletePresentation(actor, { productId: p.id, id: p.presentationId });
  return noContent();
});
