export type RuleCode =
  | "FOUNDER_PROTECTED"
  | "HAS_DATA"
  | "ROLE_EXCLUDED"
  | "NAME_TAKEN"
  | "CATEGORY_HAS_PRODUCTS"
  | "CURRENCY_IN_USE"
  | "CODE_TAKEN"
  | "VALUE_TAKEN"
  | "REASON_REQUIRED"
  | "SUPERADMIN_EXISTS"
  | "PASSWORD_TOO_SHORT"
  | "PERMISSION_REQUIRES_VIEW"
  | "NOTIFICATIONS_VIEW_ONLY"
  | "UNKNOWN_SPECIAL_PERMISSION"
  | "DUPLICATE_SPECIAL_PERMISSION"
  | "SESSION_TOO_LONG"
  | "STORE_UNAVAILABLE"
  | "INVALID_USERNAME"
  | "INVALID_SESSION_SECONDS"
  | "INVALID_NAME"
  | "INVALID_INPUT"
  | "INVALID_QUANTITY"
  | "NEGATIVE_QUANTITY"
  | "UNIT_MAGNITUDE_MISMATCH"
  | "INVALID_CONTENT"
  | "QUANTITY_MISMATCH"
  | "LOT_EXCEEDED"
  | "LOT_NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "BASE_UNIT_IN_USE"
  | "DUPLICATE_LOT"
  | "COST_NOT_ALLOWED"
  | "CHOOSE_LOT_FORBIDDEN"
  | "INVALID_UNIT"
  | "INVALID_REASON"
  | "REASON_TEXT_REQUIRED"
  | "NOT_WAREHOUSE"
  | "NOT_STORE"
  | "LOCATION_NOT_FOUND"
  | "PRODUCT_NOT_STORABLE"
  | "ADJUST_EXCEEDS_LOT"
  | "INVALID_REVERSES"
  | "STANDARD_REASON_LOCKED";

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

const STOCK_CODES: RuleCode[] = [
  "INVALID_QUANTITY", "NEGATIVE_QUANTITY", "UNIT_MAGNITUDE_MISMATCH", "INVALID_CONTENT", "QUANTITY_MISMATCH", "LOT_EXCEEDED",
  "LOT_NOT_FOUND", "INSUFFICIENT_STOCK", "BASE_UNIT_IN_USE", "DUPLICATE_LOT", "COST_NOT_ALLOWED", "CHOOSE_LOT_FORBIDDEN",
  "INVALID_UNIT", "INVALID_REASON", "REASON_TEXT_REQUIRED", "NOT_WAREHOUSE", "NOT_STORE", "LOCATION_NOT_FOUND",
  "PRODUCT_NOT_STORABLE", "ADJUST_EXCEEDS_LOT", "INVALID_REVERSES", "STANDARD_REASON_LOCKED", "CODE_TAKEN", "NAME_TAKEN",
];

/** Maps the textual code the database puts in its error message to a domain error. */
export function translateStockError(code: string): Error {
  if (/\bFORBIDDEN\b/.test(code)) return new Forbidden();
  const found = STOCK_CODES.find((c) => new RegExp(`\\b${c}\\b`).test(code));
  return found ? new RuleViolation(found) : new Error(code);
}
