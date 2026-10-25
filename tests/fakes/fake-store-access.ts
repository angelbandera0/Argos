import type { StoreAccess, StoreAccessReader } from "@/core/application/ports/store-access-reader";

export class FakeStoreAccess implements StoreAccessReader {
  constructor(readonly byUser: Record<string, StoreAccess[]>) {}

  async listStoreAccess(userId: string): Promise<StoreAccess[]> {
    return this.byUser[userId] ?? [];
  }

  async getStoreAccess(userId: string, storeId: string): Promise<StoreAccess | null> {
    return (this.byUser[userId] ?? []).find((a) => a.storeId === storeId) ?? null;
  }
}
