export function Input({
  variant = "filled",
  className,
  ...props
}: React.ComponentProps<"input"> & { variant?: "filled" | "outline" }) {
  const cls = ["input", variant === "outline" && "input-outline", className].filter(Boolean).join(" ");
  return <input className={cls} {...props} />;
}
