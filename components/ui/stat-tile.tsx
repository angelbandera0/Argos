import { NAV_ICONS, type NavIconName } from "@/components/icons";

export function StatTile({ icon, label, value }: { icon: NavIconName; label: string; value: React.ReactNode }) {
  const Icon = NAV_ICONS[icon];
  return (
    <div className="ui-stat-tile">
      <span className="ui-stat-tile-icon" aria-hidden="true">
        <Icon />
      </span>
      <div>
        <div className="ui-stat-tile-label">{label}</div>
        <div className="ui-stat-tile-value">{value}</div>
      </div>
    </div>
  );
}
