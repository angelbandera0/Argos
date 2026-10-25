export interface StoreAccess {
  storeId: string;
  storeName: string;
  siteName: string;
  companyId: string;
  roleId: string;
  roleName: string;
  roleSessionSeconds: number | null;
  companyCapSeconds: number;
  operational: boolean;
}

/** `available === operational`; login lists every assignment, chooseStore rejects unavailable ones. */
export type StoreOption = StoreAccess & { available: boolean };

export interface StoreAccessReader {
  listStoreAccess(userId: string): Promise<StoreAccess[]>;
  /** Null when the user has no assignment on that store. */
  getStoreAccess(userId: string, storeId: string): Promise<StoreAccess | null>;
}
