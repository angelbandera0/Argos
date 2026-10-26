import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type NavItem = { id: string; label: string; href: string; icon: LucideIcon };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export function AppShell({
  nav,
  active,
  user,
  children,
}: {
  nav: NavItem[];
  active: string;
  user: { name: string; role: string };
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <nav className="side" aria-label="Principal">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Argos</span>
        </div>
        <span className="overline">Menú</span>
        {nav.map(({ id, label, href, icon: Icon }) => (
          <Link
            key={id}
            className="nav-item"
            href={href}
            aria-current={id === active ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
        <div className="side-foot">
          <span className="avatar" role="img" aria-label={user.name}>
            {initials(user.name)}
          </span>
          <span className="who">
            <strong>{user.name}</strong>
            <span className="caption">{user.role}</span>
          </span>
        </div>
      </nav>
      <main className="main">
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
