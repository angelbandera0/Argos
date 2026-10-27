export interface Site {
  id: string;
  companyId: string;
  name: string;
  status: "active" | "inactive";
}

export interface SiteRepository {
  create(i: { companyId: string; name: string }): Promise<Site>;
  getById(id: string): Promise<Site | null>;
  listByParent(companyId: string): Promise<Site[]>;
}
