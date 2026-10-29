import { NAV_ICONS, type NavIconName } from "@/components/icons";

export type ChecklistItem = { state: "ok" | "warn" | "todo"; label: string };

/** Sticky side panel of a form: identity, summary card, checklist and actions. */
export function SummaryPanel({
  eyebrow = "Resumen",
  icon = "KeyRound",
  title = "",
  placeholder = "",
  subtitle,
  identity,
  children,
  actions,
}: {
  eyebrow?: string;
  icon?: NavIconName;
  title?: string;
  placeholder?: string;
  subtitle?: string;
  /** Replaces the icon + title block (e.g. a card that mimics the screen the result feeds). */
  identity?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const Icon = NAV_ICONS[icon];
  return (
    <aside className="ui-summary-panel" aria-label={eyebrow}>
      <p className="ui-summary-eyebrow">{eyebrow}</p>
      {identity ?? (
      <div className="ui-summary-id">
        <span className="ui-summary-icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <strong className="ui-summary-title" data-empty={!title || undefined}>
            {title || placeholder}
          </strong>
          {subtitle && <p className="hint">{subtitle}</p>}
        </div>
      </div>
      )}
      {children}
      {actions && <div className="ui-summary-actions">{actions}</div>}
    </aside>
  );
}

export function SummaryCard({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="ui-summary-card">
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="ui-checklist">
      {items.map((i) => (
        <li key={i.label} data-state={i.state}>
          <span className="ui-checklist-mark" aria-hidden="true">
            {i.state === "ok" ? <NAV_ICONS.Check /> : i.state === "warn" ? "!" : null}
          </span>
          {i.label}
          <span className="sr-only">{i.state === "ok" ? " (listo)" : i.state === "warn" ? " (aviso)" : " (pendiente)"}</span>
        </li>
      ))}
    </ul>
  );
}
