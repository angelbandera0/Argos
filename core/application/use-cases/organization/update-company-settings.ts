import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";

const MAX_SESSION_SECONDS = 86400;

export interface UpdateCompanySettingsDeps {
  companies: CompanyRepository;
}

export function makeUpdateCompanySettings(deps: UpdateCompanySettingsDeps) {
  return async (
    actor: Actor,
    i: { companyId: string; sessionCapSeconds: number },
  ): Promise<void> => {
    if (actor.kind !== "admin") throw new Forbidden();
    if (!(await deps.companies.getById(i.companyId))) throw new NotFound();
    const admins = await deps.companies.listAdmins(i.companyId);
    if (!admins.includes(actor.userId)) throw new Forbidden();
    const s = i.sessionCapSeconds;
    if (!Number.isInteger(s) || s <= 0) throw new RuleViolation("INVALID_SESSION_SECONDS");
    if (s > MAX_SESSION_SECONDS) throw new RuleViolation("SESSION_TOO_LONG");
    await deps.companies.setSessionCap(i.companyId, s);
  };
}
