import type { Company, CompanyRepository } from "@/core/application/ports/company-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";

export interface CreateCompanyDeps {
  companies: CompanyRepository;
}

export function makeCreateCompany(deps: CreateCompanyDeps) {
  return async (actor: Actor, i: { name: string }): Promise<Company> => {
    if (actor.kind !== "admin") throw new Forbidden();
    return deps.companies.create({ name: i.name, founderId: actor.userId });
  };
}
