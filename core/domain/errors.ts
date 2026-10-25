export type RuleCode =
  | "FOUNDER_PROTECTED"
  | "HAS_DATA"
  | "ROLE_EXCLUDED"
  | "NAME_TAKEN"
  | "CATEGORY_HAS_PRODUCTS"
  | "REASON_REQUIRED"
  | "SUPERADMIN_EXISTS"
  | "PASSWORD_TOO_SHORT"
  | "PERMISSION_REQUIRES_VIEW"
  | "SESSION_TOO_LONG"
  | "STORE_UNAVAILABLE"
  | "INVALID_USERNAME"
  | "INVALID_SESSION_SECONDS";

export class Forbidden extends Error {
  constructor() {
    super("Forbidden");
    this.name = "Forbidden";
  }
}

export class NotFound extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFound";
  }
}

export class RuleViolation extends Error {
  readonly code: RuleCode;

  constructor(code: RuleCode) {
    super(code);
    this.name = "RuleViolation";
    this.code = code;
  }
}

export class AuthFailed extends Error {
  constructor() {
    super("Usuario o PIN incorrectos");
    this.name = "AuthFailed";
  }
}

export class SessionExpired extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpired";
  }
}
