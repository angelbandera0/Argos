import { RuleViolation } from "./errors";

export const MODULES = ["products", "currencies", "stock", "requests", "orders", "notifications"] as const;
export type Module = (typeof MODULES)[number];
export type Op = "view" | "create" | "edit" | "delete";
export type PermissionSet = Record<Op, boolean>;
export type PermissionMap = Partial<Record<Module, PermissionSet>>;

export const SPECIAL_PERMISSIONS = [
  "see_costs",
  "choose_lot",
  "initial_entry",
  "direct_store_entry",
  "transfer",
  "write_off",
  "adjust_stock",
  "configure_units",
  "configure_minimums",
  "request_replenishment",
  "handle_requests",
  "build_orders",
  "make_purchases",
  "review_orders",
  "correct_orders",
] as const;
export type SpecialPermission = (typeof SPECIAL_PERMISSIONS)[number];
export interface SpecialGrant {
  permission: SpecialPermission;
  warehouse: boolean;
}

export function assertValidPermissions(p: PermissionSet, module?: Module): void {
  if (!p.view && (p.create || p.edit || p.delete)) {
    throw new RuleViolation("PERMISSION_REQUIRES_VIEW");
  }
  if (module === "notifications" && (p.create || p.edit || p.delete)) {
    throw new RuleViolation("NOTIFICATIONS_VIEW_ONLY");
  }
}

export function assertValidSpecialPermissions(grants: SpecialGrant[]): void {
  const seen = new Set<string>();
  for (const g of grants) {
    if (!(SPECIAL_PERMISSIONS as readonly string[]).includes(g.permission)) throw new RuleViolation("UNKNOWN_SPECIAL_PERMISSION");
    if (seen.has(g.permission)) throw new RuleViolation("DUPLICATE_SPECIAL_PERMISSION");
    seen.add(g.permission);
  }
}

export function hasSpecial(
  access: { specialPermissions: SpecialGrant[] },
  permission: SpecialPermission,
  opts: { warehouse?: boolean } = {},
): boolean {
  return access.specialPermissions.some((g) => g.permission === permission && (!opts.warehouse || g.warehouse));
}
