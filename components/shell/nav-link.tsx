"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./app-shell";

export function NavLink({ href, label, icon: Icon }: Omit<NavItem, "id">) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link className="nav-item" href={href} aria-current={active ? "page" : undefined}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
