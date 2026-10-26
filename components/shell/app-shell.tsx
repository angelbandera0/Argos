import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { NavLink } from "./nav-link";
import { ProfileMenu } from "./profile-menu";
import { TopClock } from "./top-clock";

const { Bell, Search } = NAV_ICONS;

export type NavItem = { id: string; label: string; href: string; icon: NavIconName };

export function AppShell({
  nav,
  user,
  top,
  action,
  children,
}: {
  nav: NavItem[];
  user: { name: string; role: string; handle?: string | null };
  top?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <nav className="side" aria-label="Principal">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Argos</span>
        </div>
        <span className="overline nav-label">Menú</span>
        {nav.map(({ id, ...item }) => (
          <NavLink key={id} {...item} />
        ))}
      </nav>
      <main className="main">
        <div className="content">
          <div className="appbar">
            <TopClock />
            <span className="spacer" />
            <button type="button" className="appbar-search" aria-disabled="true" aria-label="Buscar" title="Próximamente">
              <Search aria-hidden="true" />
              <span>Buscar</span>
            </button>
            {action}
            <Button variant="icon" aria-disabled="true" aria-label="Notificaciones" title="Próximamente">
              <Bell aria-hidden="true" />
            </Button>
            <ProfileMenu name={user.name} role={user.role} handle={user.handle ?? null} />
          </div>
          {top && <div className="appbar-context">{top}</div>}
          {children}
        </div>
      </main>
    </div>
  );
}
