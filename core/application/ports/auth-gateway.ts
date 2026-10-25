export interface AuthGateway {
  createAdminUser(i: {
    email: string;
    displayName: string;
  }): Promise<{ userId: string; temporaryPassword: string }>;
  createOperatorUser(i: {
    username: string;
    companyId: string;
    displayName: string;
  }): Promise<{ userId: string; pin: string }>;
  resetPin(userId: string): Promise<{ pin: string }>;
  setPassword(userId: string, password: string): Promise<void>;
  revokeSessions(userId: string): Promise<void>;
  ensureSuperadmin(i: {
    email: string;
    initialPassword: string;
  }): Promise<{ created: boolean }>;
}
