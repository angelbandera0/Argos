import { RuleViolation } from "./errors";

export type Module = "products";
export type Op = "view" | "create" | "edit" | "delete";
export type PermissionSet = Record<Op, boolean>;

export function assertValidPermissions(p: PermissionSet): void {
  if (!p.view && (p.create || p.edit || p.delete)) {
    throw new RuleViolation("PERMISSION_REQUIRES_VIEW");
  }
}
