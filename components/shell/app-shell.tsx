import type { NavIconName } from "@/components/icons";
import { NAV_ICONS } from "@/components/icons";
import { signOut } from "@/app/(app)/actions";
import { NavLink } from "./nav-link";

export type NavItem = { id: string; label: string; href: string; icon: NavIconName };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function SignOut({ className }: { className: string }) {
  const Icon = NAV_ICONS.LogOut;
  return (
    <form action={signOut} className={className}>
      <button type="submit" className="btn btn-icon" aria-label="Cerrar sesión" title="Cerrar sesión">
        <Icon aria-hidden="true" />
      </button>
    </form>
  );
}

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
          <SignOut className="sign-out" />
        </div>
      </nav>
      <main className="main">
        <div className="content">
          <div className="mobile-user">
            <span className="avatar" role="img" aria-label={user.name}>
              {initials(user.name)}
            </span>
            <span className="who">
              <strong>{user.name}</strong>
              <span className="caption">{user.role}</span>
            </span>
            <SignOut className="sign-out" />
          </div>
          {top}
          {children}
        </div>
      </main>
    </div>
  );
}
