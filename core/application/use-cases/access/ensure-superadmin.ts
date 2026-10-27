import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import { validateAdminPassword } from "@/core/domain/password";

export function makeEnsureSuperadmin(deps: { auth: AuthGateway }) {
  return async (i: { email: string; initialPassword: string }): Promise<{ created: boolean }> => {
    validateAdminPassword(i.initialPassword);
    return deps.auth.ensureSuperadmin(i);
  };
}
