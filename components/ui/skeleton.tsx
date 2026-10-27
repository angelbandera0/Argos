type Variant = "text" | "title" | "circle" | "pill" | "block";

export function Skeleton({
  variant = "block",
  onPanel = false,
  className,
  ...props
}: React.ComponentProps<"span"> & { variant?: Variant; onPanel?: boolean }) {
  const cls = [
    "skeleton",
    onPanel && "skeleton-on-panel",
    variant !== "block" && `skeleton-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} aria-hidden="true" {...props} />;
}
