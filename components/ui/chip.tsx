type Variant = "neutral" | "alert" | "open" | "ring";

export function Chip({
  variant = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { variant?: Variant }) {
  const v = variant === "neutral" ? "" : ` chip-${variant}`;
  return <span className={`chip${v}${className ? ` ${className}` : ""}`} {...props} />;
}
