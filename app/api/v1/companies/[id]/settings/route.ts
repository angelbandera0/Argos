import { body, noContent, params, svc } from "../../../_lib/http";
import { schemas } from "../../../_lib/schemas";
import { withActor } from "../../../_lib/with-actor";

export const PATCH = withActor(async (req, actor, ctx) => {
  const { id } = await params<{ id: string }>(ctx);
  const i = await body(req, schemas.settings);
  await svc(req).org.updateSettings(actor, { companyId: id, sessionCapSeconds: i.sessionCapSeconds });
  return noContent();
});
