import type { PinVerifier } from "@/core/application/ports/pin-verifier";
import type { StoreAccess, StoreAccessReader } from "@/core/application/ports/store-access-reader";

export class FakeStoreAccess implements StoreAccessReader {
  constructor(private readonly byUser: Record<string, StoreAccess[]>) {}

  async listStoreAccess(userId: string): Promise<StoreAccess[]> {
    return this.byUser[userId] ?? [];
  }

  async getStoreAccess(userId: string, storeId: string): Promise<StoreAccess | null> {
    return (this.byUser[userId] ?? []).find((a) => a.storeId === storeId) ?? null;
  }
}

/** Credentials keyed by "username:pin". */
export class FakePinVerifier implements PinVerifier {
  constructor(private readonly credentials: Record<string, { userId: string; sessionId: string }>) {}

  async verify(username: string, pin: string): Promise<{ userId: string; sessionId: string } | null> {
    return this.credentials[`${username}:${pin}`] ?? null;
  }
}
