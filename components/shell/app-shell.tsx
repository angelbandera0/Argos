import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { CompanySelector, type CompanySelectorProps } from "@/components/org/company-selector";
import { SidebarItem, SidebarSection, type SidebarBadge } from "@/components/ui/sidebar-section";
import type { NavSection } from "./nav-config";
import { ProfileMenu } from "./profile-menu";
import { TopClock } from "./top-clock";

const { Search } = NAV_ICONS;

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  available?: boolean;
  badge?: SidebarBadge;
  dot?: boolean;
};

export function AppShell({
  nav,
  user,
  top,
  company,
  action,
  bell,
  children,
}: {
  nav: NavSection[];
  user: { name: string; role: string; handle?: string | null };
  top?: React.ReactNode;
  company?: CompanySelectorProps;
  action?: React.ReactNode;
  bell?: React.ReactNode;
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
        {nav.map((section) => (
          <SidebarSection key={section.title} title={section.title}>
            {section.items.map(({ id, available = true, ...item }) => (
              <SidebarItem key={id} {...item} disabled={!available} />
            ))}
          </SidebarSection>
        ))}
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
            {bell}
            <ProfileMenu name={user.name} role={user.role} handle={user.handle ?? null} />
          </div>
          {top && <div className="appbar-context">{top}</div>}
          {children}
        </div>
      </main>
    </div>
  );
}
