import type { CompanyRepository, Level } from "@/core/application/ports/company-repository";
import type { UnitStatusRepository } from "@/core/application/ports/unit-status-repository";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { authorizeFounderOrSuperadmin } from "./authorize-unit";

export interface ReactivateUnitDeps {
  units: UnitStatusRepository;
  companies: CompanyRepository;
}

export function makeReactivateUnit(deps: ReactivateUnitDeps) {
  return async (actor: Actor, i: { level: Level; id: string; text: string }): Promise<void> => {
    await authorizeFounderOrSuperadmin(deps, actor, i.level, i.id);
    if ((i.text ?? "").trim() === "") throw new RuleViolation("REASON_REQUIRED");
    await deps.units.setStatus(i.level, i.id, "active", { code: "otro", text: i.text }, actor.userId);
  };
}
