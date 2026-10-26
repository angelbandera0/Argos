import type { NavIconName } from "@/components/icons";
import { NavLink } from "./nav-link";

export type NavItem = { id: string; label: string; href: string; icon: NavIconName };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export function AppShell({
  nav,
  user,
  top,
  children,
}: {
  nav: NavItem[];
  user: { name: string; role: string };
  top?: React.ReactNode;
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
        {nav.map(({ id, ...item }) => (
          <NavLink key={id} {...item} />
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
        <div className="content">
          {top}
          {children}
        </div>
      </main>
    </div>
  );
}
