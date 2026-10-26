import type { NavIconName } from "@/components/icons";
import { NavLink } from "./nav-link";
import { ProfileMenu } from "./profile-menu";

export type NavItem = { id: string; label: string; href: string; icon: NavIconName };

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
        {nav.map(({ id, ...item }) => (
          <NavLink key={id} {...item} />
        ))}
      </nav>
      <main className="main">
        <div className="content">
          <div className="appbar">
            <div className="appbar-start">{top}</div>
            <ProfileMenu name={user.name} role={user.role} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
