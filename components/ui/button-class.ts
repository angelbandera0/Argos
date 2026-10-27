export type ButtonVariant = "primary" | "secondary" | "outline" | "accent" | "ghost" | "danger" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

export function buttonClass(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return ["btn", `btn-${variant}`, size !== "md" && `btn-${size}`, className].filter(Boolean).join(" ");
}
