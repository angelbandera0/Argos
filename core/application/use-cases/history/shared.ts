import type { Clock } from "@/core/application/ports/clock";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { HistoryReader } from "@/core/application/ports/history-reader";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader } from "@/core/application/ports/store-access-reader";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";

export interface HistoryDeps {
  history: HistoryReader;
  companies: CompanyRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

/** Admins reach the companies they administer; the superadmin every company (undefined = all). */
export async function resolveAdminScope(
  deps: HistoryDeps,
  actor: Actor,
  companyId?: string,
): Promise<string | undefined> {
  if (actor.kind === "superadmin") return companyId;
  if (actor.kind !== "admin" || !companyId) throw new Forbidden();
  if (!(await deps.companies.listAdmins(companyId)).includes(actor.userId)) throw new Forbidden();
  return companyId;
}
