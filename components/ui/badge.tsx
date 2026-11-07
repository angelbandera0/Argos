import { badgeClass, type BadgeVariant } from "./feedback-utils";

export function Badge({
  variant = "neutral",
  icon,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant; icon?: React.ReactNode }) {
  return (
    <span className={badgeClass(variant, className, !!icon)} {...props}>
      {icon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
