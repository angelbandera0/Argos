import { NAV_ICONS } from "@/components/icons";

export function SalesPreview({
  category,
  name,
  description,
  paused,
}: {
  category?: string;
  name?: string;
  description?: string;
  paused?: boolean;
}) {
  return (
    <div className="ui-sales-preview">
      <span className="ui-sales-chip" data-paused={paused || undefined}>
        {paused ? "Pausado" : category || "Categoría"}
      </span>
      <div className="ui-sales-tile" data-paused={paused || undefined}>
        <span className="ui-sales-tile-icon" aria-hidden="true">
          <NAV_ICONS.Box />
        </span>
        <strong data-empty={!name || undefined}>{name || "Nombre"}</strong>
        {description && <span className="ui-sales-tile-desc">{description}</span>}
      </div>
    </div>
  );
}
