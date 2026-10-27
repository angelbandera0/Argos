import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { CompanySelector, type CompanySelectorProps } from "@/components/org/company-selector";
import { Button } from "@/components/ui/button";
import { SidebarSection } from "@/components/ui/sidebar-section";
import { NavLink } from "./nav-link";
import { ProfileMenu } from "./profile-menu";
import { TopClock } from "./top-clock";

const { Bell, Search } = NAV_ICONS;

export type NavItem = { id: string; label: string; href: string; icon: NavIconName };

export function AppShell({
  nav,
  user,
  top,
  company,
  action,
  children,
}: {
  nav: NavItem[];
  user: { name: string; role: string; handle?: string | null };
  top?: React.ReactNode;
  company?: CompanySelectorProps;
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
        {company && <CompanySelector {...company} variant="side" />}
        <SidebarSection title="Menú">
          {nav.map(({ id, ...item }) => (
            <NavLink key={id} {...item} />
          ))}
        </SidebarSection>
      </nav>
      <main className="main">
        <div className="content">
          <div className="appbar">
            {company && <CompanySelector {...company} variant="bar" />}
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
