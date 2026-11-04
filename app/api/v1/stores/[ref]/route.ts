import { body, noContent, params, parseRef, svc, unknownAction } from "../../_lib/http";
import { schemas } from "../../_lib/schemas";
import { withActor } from "../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = parseRef((await params<{ ref: string }>(ctx)).ref);
  const i = await body(req, schemas.name);
  await svc(req).org.renameUnit(actor, { level: "store", id, name: i.name });
  return noContent();
});

export const POST = withActor(async (req, actor, ctx) => {
  const { id, action } = parseRef((await params<{ ref: string }>(ctx)).ref);
  if (action === "deactivate") {
    const i = await body(req, schemas.deactivate);
    await svc(req).org.deactivateUnit(actor, { level: "store", id, reason: i.reason });
  } else if (action === "reactivate") {
    const i = await body(req, schemas.reactivate);
    await svc(req).org.reactivateUnit(actor, { level: "store", id, text: i.text });
  } else unknownAction();
  return noContent();
});
