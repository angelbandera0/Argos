import { RuleViolation } from "./errors";

const MIN_ADMIN_PASSWORD_LENGTH = 12;

export function validateAdminPassword(password: string): void {
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new RuleViolation("PASSWORD_TOO_SHORT");
  }
}
