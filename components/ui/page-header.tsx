import { Breadcrumbs } from "./breadcrumbs";
import type { Crumb } from "./nav-utils";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="page-header-row">
        <h1 className="page-title">{title}</h1>
        <span className="spacer" />
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {description && <p className="muted">{description}</p>}
    </header>
  );
}
