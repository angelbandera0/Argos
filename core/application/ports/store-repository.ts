export interface Store {
  id: string;
  companyId: string;
  siteId: string;
  name: string;
  status: "active" | "inactive";
}

export interface StoreRepository {
  create(i: { companyId: string; siteId: string; name: string }): Promise<Store>;
  getById(id: string): Promise<Store | null>;
  listByParent(siteId: string): Promise<Store[]>;
}
