"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, Children } from "react";
import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { isActivePath } from "./nav-utils";

const { ChevronDown } = NAV_ICONS;

export type SidebarBadge = { kind: "count" | "alert" | "new"; text: string };

function Badge({ badge }: { badge?: SidebarBadge }) {
  return badge ? <b className={`nav-badge nav-badge-${badge.kind}`}>{badge.text}</b> : null;
}

export function SidebarSection({
  title,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const hiddenCount = Children.count(children);
  return (
    <div className="sb-section" role="group" aria-labelledby={`${id}-t`}>
      {collapsible ? (
        <button
          type="button"
          id={`${id}-t`}
          className="eyebrow nav-label sb-title"
          aria-expanded={open}
          aria-controls={`${id}-items`}
          onClick={() => setOpen(!open)}
        >
          {title}
          {!open && <span className="sb-count">· {hiddenCount} ocultos</span>}
          <ChevronDown aria-hidden="true" />
        </button>
      ) : (
        <span id={`${id}-t`} className="eyebrow nav-label">
          {title}
        </span>
      )}
      <div id={`${id}-items`} className="sb-items" hidden={collapsible && !open}>
        {children}
      </div>
    </div>
  );
}

export function SidebarItem({
  href,
  label,
  icon,
  badge,
  dot,
  active,
}: {
  href: string;
  label: string;
  icon: NavIconName;
  badge?: SidebarBadge;
  dot?: boolean;
  active?: boolean;
}) {
  const pathname = usePathname();
  const Icon = NAV_ICONS[icon];
  const current = active ?? isActivePath(pathname, href);
  return (
    <Link className="nav-item" href={href} title={label} data-badge={badge ? "" : undefined} aria-current={current ? "page" : undefined}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <Badge badge={badge} />
      {dot && <i className="nav-dot" aria-hidden="true" />}
    </Link>
  );
}

export function SidebarSubmenu({
  label,
  icon,
  items,
  defaultOpen = false,
}: {
  label: string;
  icon: NavIconName;
  items: { href: string; label: string; badge?: SidebarBadge; active?: boolean }[];
  defaultOpen?: boolean;
}) {
  const id = useId();
  const pathname = usePathname();
  const childActive = items.some((i) => i.active ?? isActivePath(pathname, i.href));
  const [open, setOpen] = useState(defaultOpen || childActive);
  const Icon = NAV_ICONS[icon];
  return (
    <div className="nav-group" data-child-active={childActive || undefined}>
      <button type="button" className="nav-item nav-parent" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <Icon aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown className="nav-parent-chevron" aria-hidden="true" />
      </button>
      <div id={id} className="nav-sub" hidden={!open}>
        {items.map((i, n) => {
          const current = i.active ?? isActivePath(pathname, i.href);
          return (
            <Link key={`${n}|${i.href}`} className="nav-item" href={i.href} aria-current={current ? "page" : undefined}>
              <span>{i.label}</span>
              <Badge badge={i.badge} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
