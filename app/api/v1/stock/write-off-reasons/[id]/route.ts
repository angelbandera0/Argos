import { body, noContent, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const { name, active } = await body(req, schemas.updateWriteOffReason);
  const stock = svc(req).stock;
  if (name !== undefined) await stock.renameWriteOffReason(actor, { id, name });
  if (active !== undefined) await stock.setWriteOffReasonActive(actor, { id, active });
  return noContent();
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  await svc(req).stock.deleteWriteOffReason(actor, { id });
  return noContent();
});
