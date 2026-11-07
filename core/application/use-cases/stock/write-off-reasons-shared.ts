import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { resolveStockScope } from "./shared";
import type { StockOpsDeps } from "./operations-shared";

export async function loadReasonForAdmin(deps: StockOpsDeps, actor: Actor, id: string) {
  const reason = await deps.reasons.get(id);
  if (!reason) throw new NotFound();
  const scope = await resolveStockScope(deps, actor, { companyId: reason.companyId });
  if (!scope.isAdmin) throw new Forbidden();
  return reason;
}
