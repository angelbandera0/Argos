export interface PinVerifier {
  verify(
    username: string,
    pin: string,
  ): Promise<{ userId: string; sessionId: string } | null>;
}
