"use client";

import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { NAV_ICONS, type NavIconName } from "@/components/icons";

export type AccordionEntry = {
  value: string;
  title: string;
  subtitle?: string;
  icon?: NavIconName;
  summary?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  disabled?: boolean;
  content: React.ReactNode;
};

export function Accordion({
  items,
  variant = "list",
  className,
  ...root
}: Omit<BaseAccordion.Root.Props, "children" | "className"> & {
  items: AccordionEntry[];
  variant?: "list" | "cards" | "rich";
  className?: string;
}) {
  return (
    <BaseAccordion.Root className={`acc acc-${variant}${className ? ` ${className}` : ""}`} {...root}>
      {items.map((it) => {
        const Icon = it.icon && NAV_ICONS[it.icon];
        return (
          <BaseAccordion.Item key={it.value} value={it.value} disabled={it.disabled} className="acc-item">
            <BaseAccordion.Header className="acc-head">
              <BaseAccordion.Trigger className="acc-trigger">
                {Icon && (
                  <span className="acc-icon" aria-hidden="true">
                    <Icon />
                  </span>
                )}
                <span className="acc-text">
                  <span className="acc-title">{it.title}</span>
                  {it.subtitle && <span className="acc-sub">{it.subtitle}</span>}
                </span>
                {it.summary && <span className="acc-summary">{it.summary}</span>}
                {it.badge}
                <span className="acc-chevron" aria-hidden="true">
                  <NAV_ICONS.ChevronDown />
                </span>
              </BaseAccordion.Trigger>
              {it.action}
            </BaseAccordion.Header>
            <BaseAccordion.Panel className="acc-panel">{it.content}</BaseAccordion.Panel>
          </BaseAccordion.Item>
        );
      })}
    </BaseAccordion.Root>
  );
}
