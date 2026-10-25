import type { Actor } from "@/core/domain/actor";

export type Level = "company" | "site" | "store";

export interface Company {
  id: string;
  code: string;
  name: string;
  founderId: string;
  status: "active" | "inactive";
  sessionCapSeconds: number;
}

export interface CompanyRepository {
  create(i: { name: string; founderId: string }): Promise<Company>;
  getById(id: string): Promise<Company | null>;
  listForActor(actor: Actor): Promise<Company[]>;
  listAdmins(companyId: string): Promise<string[]>;
  grantAccess(companyId: string, adminId: string, grantedBy: string): Promise<void>;
  revokeAccess(companyId: string, adminId: string): Promise<void>;
  setSessionCap(companyId: string, seconds: number): Promise<void>;
}
