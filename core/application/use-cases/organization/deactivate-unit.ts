import type { CompanyRepository, Level } from "@/core/application/ports/company-repository";
import type { UnitStatusRepository } from "@/core/application/ports/unit-status-repository";
import type { Actor } from "@/core/domain/actor";
import { type Reason, validateDeactivationReason } from "@/core/domain/deactivation";
import { RuleViolation } from "@/core/domain/errors";
import { authorizeFounderOrSuperadmin } from "./authorize-unit";

export interface DeactivateUnitDeps {
  units: UnitStatusRepository;
  companies: CompanyRepository;
}

export function makeDeactivateUnit(deps: DeactivateUnitDeps) {
  return async (actor: Actor, i: { level: Level; id: string; reason: Reason }): Promise<void> => {
    await authorizeFounderOrSuperadmin(deps, actor, i.level, i.id);
    if (!i.reason) throw new RuleViolation("REASON_REQUIRED");
    validateDeactivationReason(i.reason);
    await deps.units.setStatus(i.level, i.id, "inactive", i.reason, actor.userId);
  };
}
