"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import Link from "next/link";
import { NAV_ICONS } from "@/components/icons";
import { collapseCrumbs, type Crumb } from "./nav-utils";

const { ChevronLeft, ChevronRight, House } = NAV_ICONS;

function Item({ crumb, current, home }: { crumb: Crumb; current?: boolean; home?: boolean }) {
  if (current || !crumb.href) {
    return (
      <span aria-current={current ? "page" : undefined} className={current ? "crumb-current" : undefined}>
        {crumb.label}
      </span>
    );
  }
  return home ? (
    <Link className="crumb-home" href={crumb.href} aria-label={crumb.label} title={crumb.label}>
      <House aria-hidden="true" />
    </Link>
  ) : (
    <Link href={crumb.href}>{crumb.label}</Link>
  );
}

export function Breadcrumbs({ items, withHome = false }: { items: Crumb[]; withHome?: boolean }) {
  const { head, hidden, tail } = collapseCrumbs(items);
  const last = items[items.length - 1];
  const parent = items[items.length - 2];
  const nodes: { key: string; node: React.ReactNode }[] = [
    ...head.map((c, i) => ({ key: `h${i}`, node: <Item crumb={c} current={c === last} home={withHome && i === 0} /> })),
    ...(hidden.length
      ? [
          {
            key: "more",
            node: (
              <BaseMenu.Root>
                <BaseMenu.Trigger className="crumb-more" aria-label="Mostrar niveles ocultos">
                  …
                </BaseMenu.Trigger>
                <BaseMenu.Portal>
                  <BaseMenu.Positioner className="ui-positioner" sideOffset={8}>
                    <BaseMenu.Popup className="menu-popup">
                      {hidden.map((c) => (
                        <BaseMenu.LinkItem key={c.label} className="menu-item" href={c.href}>
                          {c.label}
                        </BaseMenu.LinkItem>
                      ))}
                    </BaseMenu.Popup>
                  </BaseMenu.Positioner>
                </BaseMenu.Portal>
              </BaseMenu.Root>
            ),
          },
        ]
      : []),
    ...tail.map((c, i) => ({ key: `t${i}`, node: <Item crumb={c} current={c === last} /> })),
  ];
  return (
    <nav className="crumbs" aria-label="Migas de pan">
      <ol>
        {nodes.map((e, i) => (
          <li key={e.key}>
            {i > 0 && <ChevronRight className="crumb-sep" aria-hidden="true" />}
            {e.node}
          </li>
        ))}
      </ol>
      {parent?.href && (
        <Link className="crumb-back" href={parent.href}>
          <ChevronLeft aria-hidden="true" />
          Nivel anterior
        </Link>
      )}
    </nav>
  );
}
