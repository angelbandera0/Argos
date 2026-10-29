import { NAV_ICONS } from "@/components/icons";
import { avatarTone } from "@/components/org/company-avatar";
import { initials } from "@/components/shell/initials";

/** Initials in a deterministic tone (same palette as the company selector); `system` shows a gear. */
export function Avatar({
  name,
  size = "sm",
  system,
  toneKey,
  className,
}: {
  name: string;
  size?: "sm" | "md";
  system?: boolean;
  /** Seed of the tone when it must not depend on the name (e.g. a role). */
  toneKey?: string;
  className?: string;
}) {
  const Gear = NAV_ICONS.Settings;
  return (
    <span
      className={`ui-avatar ui-avatar-${size} ${system ? "co-tone-none" : `co-tone-${avatarTone(toneKey ?? name)}`}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {system ? <Gear /> : initials(name).slice(0, 2) || "?"}
    </span>
  );
}
