/** TOTP factors of the signed-in user (acts with the user's own session). */
export interface MfaGateway {
  hasTotp(): Promise<boolean>;
  /** Refuses when a verified factor exists; replaces any unverified one. */
  enrollTotp(): Promise<{ factorId: string; qrCode: string; secret: string }>;
  /** Without factorId, verifies against the user's verified factor. Raises the session to aal2. */
  verifyTotp(i: { code: string; factorId?: string }): Promise<void>;
}
