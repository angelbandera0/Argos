import type { PinVerifier } from "@/core/application/ports/pin-verifier";

/** Credentials keyed by "username:pin". */
export class FakePinVerifier implements PinVerifier {
  constructor(private readonly credentials: Record<string, { userId: string; sessionId: string }>) {}

  async verify(username: string, pin: string): Promise<{ userId: string; sessionId: string } | null> {
    return this.credentials[`${username}:${pin}`] ?? null;
  }
}
