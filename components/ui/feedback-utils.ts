import type { NavIconName } from "@/components/icons";

export type Tone = "success" | "warning" | "danger" | "info";

export const TONE_ICON: Record<Tone, NavIconName> = {
  success: "Check",
  warning: "TriangleAlert",
  danger: "X",
  info: "Info",
};

export const alertRole = (tone: Tone) => (tone === "danger" ? "alert" : "status");

export const TOAST_LIMIT = 3;
const TOAST_TIMEOUT = 5000;
export const toastTimeout = (tone: Tone) => (tone === "danger" ? 0 : TOAST_TIMEOUT);

export type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "new" | "count";
export const badgeClass = (variant: BadgeVariant, className?: string) =>
  `badge badge-${variant}${variant === "count" ? "" : " badge-dot"}${className ? ` ${className}` : ""}`;

export type ChipVariant = "neutral" | "alert" | "open" | "ring" | Tone;
export function chipClass(opts: { variant?: ChipVariant; filter?: boolean; removable?: boolean; className?: string }) {
  const { variant = "neutral", filter, removable, className } = opts;
  return [
    "chip",
    variant !== "neutral" && `chip-${variant}`,
    filter && "chip-filter",
    removable && "chip-removable",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
