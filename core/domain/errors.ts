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
  | "INVALID_TIMEZONE"
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
  | "INSUFFICIENT_PACKS"
  | "BASE_UNIT_LOCKED"
  | "STORABLE_LOCKED"
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
  | "INVALID_COST"
  | "CURRENCY_REQUIRED"
  | "INVALID_REVERSES"
  | "STANDARD_REASON_LOCKED"
  | "EMPTY_REQUEST"
  | "DUPLICATE_PRODUCT"
  | "ASSIGNMENT_EXCEEDS_LINE"
  | "INVALID_KIND"
  | "EMPTY_ORDER"
  | "PLAN_MISMATCH"
  | "BUYER_NOT_ELIGIBLE"
  | "BUYER_CANNOT_REVIEW"
  | "INVALID_STATUS"
  | "PURCHASE_INCOMPLETE"
  | "MISSING_COST"
  | "REPARTO_REQUIRED"
  | "REPARTO_MISMATCH"
  | "NOTE_REQUIRED"
  | "INVALID_LINES"
  | "ASSIGNMENT_ALREADY_ORDERED"
  | "INVALID_LOCATION"
  | "INVALID_ASSIGNMENT"
  | "INVALID_PLAN"
  | "INVALID_CURRENCY";

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
  "LOT_NOT_FOUND", "INSUFFICIENT_STOCK", "INSUFFICIENT_PACKS", "BASE_UNIT_LOCKED", "STORABLE_LOCKED", "DUPLICATE_LOT", "COST_NOT_ALLOWED", "CHOOSE_LOT_FORBIDDEN",
  "INVALID_UNIT", "INVALID_REASON", "REASON_TEXT_REQUIRED", "NOT_WAREHOUSE", "NOT_STORE", "LOCATION_NOT_FOUND",
  "PRODUCT_NOT_STORABLE", "ADJUST_EXCEEDS_LOT", "INVALID_REVERSES", "STANDARD_REASON_LOCKED", "CODE_TAKEN", "NAME_TAKEN",
  "INVALID_COST", "CURRENCY_REQUIRED",
];

/** Maps the textual code the database puts in its error message to a domain error. */
export function translateStockError(code: string): Error {
  if (/\bFORBIDDEN\b/.test(code)) return new Forbidden();
  const found = STOCK_CODES.find((c) => new RegExp(`\\b${c}\\b`).test(code));
  return found ? new RuleViolation(found) : new Error(code);
}

const REQUEST_CODES: RuleCode[] = ["EMPTY_REQUEST", "DUPLICATE_PRODUCT", "ASSIGNMENT_EXCEEDS_LINE", "INVALID_KIND", "REASON_REQUIRED"];

/** Same as translateStockError, plus the request codes (attending a line may also fail on the transfer). */
export function translateRequestError(code: string): Error {
  if (/\b(STORE_NOT_FOUND|LINE_NOT_FOUND)\b/.test(code)) return new NotFound();
  const found = REQUEST_CODES.find((c) => new RegExp(`\\b${c}\\b`).test(code));
  return found ? new RuleViolation(found) : translateStockError(code);
}

const ORDER_CODES: RuleCode[] = [
  "PLAN_MISMATCH", "BUYER_NOT_ELIGIBLE", "BUYER_CANNOT_REVIEW", "INVALID_STATUS", "PURCHASE_INCOMPLETE", "MISSING_COST",
  "REPARTO_REQUIRED", "REPARTO_MISMATCH", "NOTE_REQUIRED", "INVALID_LINES", "ASSIGNMENT_ALREADY_ORDERED", "INVALID_LOCATION",
  "INVALID_ASSIGNMENT", "INVALID_PLAN", "INVALID_CURRENCY",
];

/** Same as translateStockError, plus the order codes (confirming and adjusting also touch stock). */
export function translateOrderError(code: string): Error {
  if (/\b(ORDER_NOT_FOUND|LINE_NOT_IN_ORDER|LOT_NOT_IN_ORDER)\b/.test(code)) return new NotFound();
  const found = ORDER_CODES.find((c) => new RegExp(`\\b${c}\\b`).test(code));
  return found ? new RuleViolation(found) : translateStockError(code);
}
