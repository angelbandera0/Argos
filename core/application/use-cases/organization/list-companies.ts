import type { Company, CompanyRepository } from "@/core/application/ports/company-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";

export interface ListCompaniesDeps {
  companies: CompanyRepository;
}

export function makeListCompanies(deps: ListCompaniesDeps) {
  return async (actor: Actor): Promise<Company[]> => {
    if (actor.kind === "operator") throw new Forbidden();
    return deps.companies.listForActor(actor);
  };
}
