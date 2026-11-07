import { body, noContent, params, svc } from "../../../../../_lib/http";
import { schemas } from "../../../../../_lib/schemas";
import { withActor } from "../../../../../_lib/with-actor";

type Ctx = { id: string; unitId: string };

export const PATCH = withActor(async (req, actor, ctx) => {
  const p = await params<Ctx>(ctx);
  const { active, ...changes } = await body(req, schemas.updateMovementUnit);
  const stock = svc(req).stock;
  const ref = { productId: p.id, id: p.unitId };
  if (Object.keys(changes).length) await stock.updateMovementUnit(actor, { ...ref, ...changes });
  if (active !== undefined) await stock.setMovementUnitActive(actor, { ...ref, active });
  return noContent();
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const p = await params<Ctx>(ctx);
  await svc(req).stock.deleteMovementUnit(actor, { productId: p.id, id: p.unitId });
  return noContent();
});
