import { noContent, params, parseRef, secret, svc, unknownAction } from "../../_lib/http";
import { withActor } from "../../_lib/with-actor";

export const POST = withActor(async (req, actor, ctx) => {
  const { id, action } = parseRef((await params<{ ref: string }>(ctx)).ref);
  const { users } = svc(req);
  if (action === "reset-pin") return secret(await users.resetPin(actor, { userId: id }));
  if (action === "unlock") return secret(await users.unlockUser(actor, { userId: id }));
  if (action === "deactivate") {
    await users.deactivateUser(actor, { userId: id });
    return noContent();
  }
  return unknownAction();
});
