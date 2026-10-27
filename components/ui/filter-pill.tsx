"use client";

import { NAV_ICONS } from "@/components/icons";

const { ChevronDown, X } = NAV_ICONS;

/**
 * Filter pill shell: no value (ring border), with value (red tint + ✕ to remove) and open (red border + halo).
 * `trigger` renders the actual button (Select, Popover…) with the content and class to use.
 */
export function FilterPill({
  label,
  valueText,
  emptyText = "Todos",
  leading,
  icon,
  hideLabelWhenSet,
  open,
  onClear,
  trigger,
  ref,
}: {
  label: string;
  valueText?: string;
  emptyText?: string;
  leading?: React.ReactNode;
  icon?: React.ReactNode;
  hideLabelWhenSet?: boolean;
  open?: boolean;
  onClear?: () => void;
  trigger: (content: React.ReactNode, className: string) => React.ReactElement;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const has = !!valueText;
  return (
    <div ref={ref} className="filter-pill" data-has-value={has || undefined} data-open={open || undefined}>
      {trigger(
        <>
          {leading}
          {icon}
          {!(has && hideLabelWhenSet) && <span className="filter-label">{label}:</span>}
          <span className="filter-value">{has ? valueText : emptyText}</span>
          <ChevronDown aria-hidden="true" className="filter-chevron" />
        </>,
        "filter-trigger",
      )}
      {has && onClear && (
        <button type="button" className="filter-clear" aria-label={`Quitar filtro ${label}`} onClick={onClear}>
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
