export type EntityCardDatum = { label: string; value: React.ReactNode };

export function EntityCard({
  avatar,
  title,
  code,
  chip,
  subtitle,
  badge,
  data = [],
  children,
  actions,
  inactive,
  className,
  ...props
}: Omit<React.ComponentProps<"article">, "title"> & {
  avatar: React.ReactNode;
  title: React.ReactNode;
  code?: React.ReactNode;
  chip?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  data?: EntityCardDatum[];
  actions?: React.ReactNode;
  inactive?: boolean;
}) {
  return (
    <article className={`ui-entity-card${className ? ` ${className}` : ""}`} data-inactive={inactive || undefined} {...props}>
      <header className="ui-entity-card-head">
        <span className="ui-entity-card-avatar" aria-hidden="true">
          {avatar}
        </span>
        <div className="ui-entity-card-id">
          <h2 className="ui-entity-card-title">{title}</h2>
          {(code || chip || subtitle) && (
            <div className="ui-entity-card-meta">
              {code && <span className="ui-entity-card-code">{code}</span>}
              {chip}
              {subtitle && <span className="ui-entity-card-subtitle">{subtitle}</span>}
            </div>
          )}
        </div>
        {badge}
      </header>
      {data.length > 0 && (
        <dl className="ui-entity-card-data">
          {data.map((d) => (
            <div key={d.label}>
              <dt>{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children}
      {actions && <footer className="ui-entity-card-actions">{actions}</footer>}
    </article>
  );
}
