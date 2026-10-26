import { badgeClass, type BadgeVariant } from "./feedback-utils";

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return <span className={badgeClass(variant, className)} {...props} />;
}
