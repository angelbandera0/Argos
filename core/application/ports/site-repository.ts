export interface Site {
  id: string;
  companyId: string;
  name: string;
  status: "active" | "inactive";
}

export interface SiteRepository {
  create(i: { companyId: string; name: string }): Promise<Site>;
  getById(id: string): Promise<Site | null>;
  rename(id: string, name: string): Promise<void>;
  listByParent(companyId: string): Promise<Site[]>;
}
