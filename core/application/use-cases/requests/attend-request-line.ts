import type { Pick } from "@/core/application/ports/stock-operations";
import type { Actor } from "@/core/domain/actor";
import { NotFound } from "@/core/domain/errors";
import { remainingBase, validateAttend, type AssignmentKind } from "@/core/domain/requests";
import { requireHandler, resolveRequestScope, type RequestDeps } from "./shared";

export function makeAttendRequestLine(deps: RequestDeps) {
  return async (
    actor: Actor,
    input: { companyId?: string; lineId: string; kind: AssignmentKind; qtyBase: number; reason?: string; picks?: Pick[]; deviationReason?: string },
  ): Promise<string> => {
    const scope = await resolveRequestScope(deps, actor, input);
    requireHandler(scope);
    const request = await deps.requests.getByLine(input.lineId);
    if (!request || request.companyId !== scope.companyId) throw new NotFound();
    const line = request.lines.find((l) => l.id === input.lineId);
    if (!line) throw new NotFound();
    const decision = validateAttend(input, remainingBase(line.qtyBase, line.assignments));
    return deps.requests.attendLine({
      lineId: input.lineId,
      kind: input.kind,
      ...decision,
      picks: input.kind === "fulfilled" ? input.picks : undefined,
      deviationReason: input.kind === "fulfilled" ? input.deviationReason : undefined,
    });
  };
}
