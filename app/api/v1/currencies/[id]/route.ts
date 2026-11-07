import { body, noContent, params, svc } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const GET = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  return Response.json(await svc(req).currencies.getCurrency(actor, { id }));
});

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const { active, ...changes } = await body(req, schemas.updateCurrency);
  const currencies = svc(req).currencies;
  if (Object.keys(changes).length) await currencies.updateCurrency(actor, { id, ...changes });
  if (active !== undefined) await currencies.setCurrencyActive(actor, { id, active });
  return noContent();
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  await svc(req).currencies.deleteCurrency(actor, { id });
  return noContent();
});
