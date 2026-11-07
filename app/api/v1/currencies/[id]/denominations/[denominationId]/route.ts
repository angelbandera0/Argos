import { body, noContent, params, svc } from "../../../../_lib/http";
import { schemas } from "../../../../_lib/schemas";
import { withActor } from "../../../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { denominationId: id } = await params<{ denominationId: string }>(ctx);
  const { active, ...changes } = await body(req, schemas.updateDenomination);
  const currencies = svc(req).currencies;
  if (Object.keys(changes).length) await currencies.updateDenomination(actor, { id, ...changes });
  if (active !== undefined) await currencies.setDenominationActive(actor, { id, active });
  return noContent();
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const { denominationId: id } = await params<{ denominationId: string }>(ctx);
  await svc(req).currencies.deleteDenomination(actor, { id });
  return noContent();
});
