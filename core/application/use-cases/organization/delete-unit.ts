import type { CompanyRepository, Level } from "@/core/application/ports/company-repository";
import type { UnitStatusRepository } from "@/core/application/ports/unit-status-repository";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { authorizeFounderOrSuperadmin } from "./authorize-unit";

export interface DeleteUnitDeps {
  units: UnitStatusRepository;
  companies: CompanyRepository;
}

export function makeDeleteUnit(deps: DeleteUnitDeps) {
  return async (actor: Actor, i: { level: Level; id: string }): Promise<void> => {
    await authorizeFounderOrSuperadmin(deps, actor, i.level, i.id);
    if (await deps.units.hasData(i.level, i.id)) throw new RuleViolation("HAS_DATA");
    await deps.units.softDelete(i.level, i.id);
  };
}
