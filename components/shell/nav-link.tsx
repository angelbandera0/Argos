"use client";

import { NAV_ICONS } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./app-shell";

export function NavLink({ href, label, icon }: Omit<NavItem, "id">) {
  const Icon = NAV_ICONS[icon];
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link className="nav-item" href={href} title={label} aria-current={active ? "page" : undefined}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
