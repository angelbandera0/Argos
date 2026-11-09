import { NAV_ICONS, type NavIconName } from "@/components/icons";

/** Icon in a circle, or (`dot`) a small colour dot before the label. */
export function StatTile({
  icon,
  dot,
  label,
  hint,
  value,
}: {
  icon?: NavIconName;
  dot?: "ink" | "success" | "warning" | "muted";
  label: string;
  hint?: string;
  value: React.ReactNode;
}) {
  const Icon = icon && NAV_ICONS[icon];
  return (
    <div className="ui-stat-tile">
      {Icon && (
        <span className="ui-stat-tile-icon" aria-hidden="true">
          <Icon />
        </span>
      )}
      {dot && <span className={`ui-stat-tile-dot ui-stat-dot-${dot}`} aria-hidden="true" />}
      <div>
        <div className="ui-stat-tile-label">{label}</div>
        <div className="ui-stat-tile-value" data-long={typeof value === "string" && value.length > 12 ? "" : undefined}>{value}</div>
        {hint && <div className="ui-stat-tile-label">{hint}</div>}
      </div>
    </div>
  );
}
