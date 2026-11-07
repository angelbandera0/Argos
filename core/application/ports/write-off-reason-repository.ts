export interface WriteOffReason {
  id: string;
  companyId: string;
  code: string;
  name: string;
  active: boolean;
  standard: boolean;
  requiresText: boolean;
}

export interface WriteOffReasonRepository {
  /** Not deleted, ordered by name. */
  list(companyId: string): Promise<WriteOffReason[]>;
  get(id: string): Promise<WriteOffReason | null>;
  create(companyId: string, i: { code: string; name: string }): Promise<WriteOffReason>;
  rename(id: string, name: string): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
  delete(id: string): Promise<void>;
}
