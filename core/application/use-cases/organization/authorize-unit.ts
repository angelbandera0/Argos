import type { CompanyRepository, Level } from "@/core/application/ports/company-repository";
import type { UnitStatusRepository } from "@/core/application/ports/unit-status-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";

export async function authorizeFounderOrSuperadmin(
  deps: { units: UnitStatusRepository; companies: CompanyRepository },
  actor: Actor,
  level: Level,
  id: string,
): Promise<void> {
  if (actor.kind === "operator") throw new Forbidden();
  const companyId = await deps.units.getCompanyId(level, id);
  if (!companyId) throw new NotFound();
  if (actor.kind === "superadmin") return;
  const company = await deps.companies.getById(companyId);
  if (!company) throw new NotFound();
  if (company.founderId !== actor.userId) throw new Forbidden();
}
