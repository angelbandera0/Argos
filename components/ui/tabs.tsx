"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";

export type TabItem = { value: string; label: string; count?: number; disabled?: boolean; content?: React.ReactNode };

export function Tabs({
  items,
  variant = "underline",
  "aria-label": ariaLabel,
  className,
  ...root
}: Omit<BaseTabs.Root.Props, "children" | "className"> & {
  items: TabItem[];
  variant?: "underline" | "segmented";
  "aria-label": string;
  className?: string;
}) {
  return (
    <BaseTabs.Root className={className} {...root}>
      <BaseTabs.List className={`tabs-list tabs-${variant}`} aria-label={ariaLabel}>
        {items.map((t) => (
          <BaseTabs.Tab key={t.value} value={t.value} disabled={t.disabled} className="tab">
            {t.label}
            {t.count !== undefined && <span className="tab-count">{t.count}</span>}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {items.map(
        (t) =>
          t.content !== undefined && (
            <BaseTabs.Panel key={t.value} value={t.value} className="tabs-panel">
              {t.content}
            </BaseTabs.Panel>
          ),
      )}
    </BaseTabs.Root>
  );
}
