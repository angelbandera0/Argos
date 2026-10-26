import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { alertRole, TONE_ICON, type Tone } from "./feedback-utils";

export function Banner({
  variant = "info",
  icon,
  action,
  children,
}: {
  variant?: Tone;
  icon?: NavIconName;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const Icon = NAV_ICONS[icon ?? TONE_ICON[variant]];
  return (
    <div role={alertRole(variant)} className={`banner tone-${variant}`}>
      <span className="icon-circle icon-circle-sm" aria-hidden="true">
        <Icon />
      </span>
      <div className="banner-text">{children}</div>
      {action}
    </div>
  );
}
