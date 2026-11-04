import { body, noContent, params, parseRef, svc, unknownAction } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = parseRef((await params<{ ref: string }>(ctx)).ref);
  const i = await body(req, schemas.updateProduct);
  await svc(req).catalog.updateProduct(actor, { id, ...i });
  return noContent();
});

export const POST = withActor(async (req, actor, ctx) => {
  const { id, action } = parseRef((await params<{ ref: string }>(ctx)).ref);
  if (action !== "activate" && action !== "deactivate") return unknownAction();
  await svc(req).catalog.setProductActive(actor, { id, active: action === "activate" });
  return noContent();
});

export const DELETE = withActor(async (req, actor, ctx) => {
  const { id } = parseRef((await params<{ ref: string }>(ctx)).ref);
  await svc(req).catalog.deleteProduct(actor, { id });
  return noContent();
});
