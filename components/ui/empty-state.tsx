import { NAV_ICONS, type NavIconName } from "@/components/icons";

export function EmptyState({
  icon = "Inbox",
  title,
  children,
  action,
}: {
  icon?: NavIconName;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon = NAV_ICONS[icon];
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        <Icon />
      </span>
      <h3 className="empty-state-title">{title}</h3>
      {children && <p className="empty-state-text">{children}</p>}
      {action}
    </div>
  );
}
