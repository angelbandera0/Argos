import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CompanySelector } from "@/components/org/company-selector";
import { StoreSwitcher } from "@/components/shell/store-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { CATEGORIES, PRODUCTS, operatorNav } from "@/components/shell/catalog-nav";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeOrg } from "@/infrastructure/supabase/org-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { ACTIVE_COMPANY_COOKIE } from "./companias/guard";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import { makeUsers } from "@/infrastructure/supabase/users-factory";

const HOME: NavItem = { id: "inicio", label: "Inicio", href: "/", icon: "LayoutDashboard" };
const COMPANIES: NavItem = { id: "companias", label: "Compañías", href: "/companias", icon: "Building2" };
const ROLES: NavItem = { id: "roles", label: "Roles", href: "/roles", icon: "KeyRound" };
const USERS: NavItem = { id: "usuarios", label: "Usuarios", href: "/usuarios", icon: "Users" };
const ADMINS: NavItem = {
  id: "administradores",
  label: "Administradores",
  href: "/superadmin/administradores",
  icon: "ShieldCheck",
};

async function OperatorShell({
  userId,
  sessionId,
  children,
}: {
  userId: string;
  sessionId: string | null;
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const users = makeUsers(supabase);
  const session = sessionId ? await users.sessions.get(sessionId) : null;
  if (!session || session.endedAt || !session.activeStoreId) redirect("/tienda");
  const [profile, stores] = await Promise.all([users.users.getProfile(userId), users.access.listStoreAccess(userId)]);
  const active = stores.find((s) => s.storeId === session.activeStoreId && s.operational);
  if (!active) redirect("/tienda");
  return (
    <AppShell
      top={
        <div className="op-bar">
          <StoreSwitcher
            activeId={active.storeId}
            stores={stores.map((s) => ({ id: s.storeId, name: s.storeName, site: s.siteName, available: s.operational }))}
          />
        </div>
      }
      nav={[HOME, ...operatorNav(active.permissions.products)]}
      user={{ name: profile?.displayName ?? "Operador", role: active.roleName, handle: profile?.username }}
    >
      {children}
    </AppShell>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims) return children;
  if (claims.kind === "operator") return <OperatorShell userId={claims.userId} sessionId={claims.sessionId}>{children}</OperatorShell>;
  const profile = await makeUserRepository(supabase).getProfile(claims.userId);
  const superadmin = claims.kind === "superadmin";
  let selector: React.ReactNode;
  if (claims.kind === "admin" && claims.aal === "aal2" && !claims.mustChangePassword) {
    const companies = await makeOrg(supabase).listCompanies({ userId: claims.userId, kind: "admin", channel: "ui" });
    const cookieId = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
    const activeId = companies.some((c) => c.id === cookieId) ? cookieId : undefined;
    if (companies.length > 0) {
      selector = <CompanySelector companies={companies.map((c) => ({ id: c.id, name: c.name }))} activeId={activeId} />;
    }
  }
  return (
    <AppShell
      top={selector}
      nav={superadmin ? [HOME, ADMINS, COMPANIES] : [HOME, COMPANIES, ROLES, USERS, CATEGORIES, PRODUCTS]}
      user={{
        name: profile?.displayName ?? claims.email,
        role: superadmin ? "Superadmin" : "Administrador",
        handle: claims.email,
      }}
    >
      {children}
    </AppShell>
  );
}

function ShellSkeleton() {
  return (
    <div className="app" aria-busy="true">
      <nav className="side" aria-label="Principal">
        <Skeleton variant="title" />
        <Skeleton variant="pill" />
        <Skeleton variant="pill" />
      </nav>
      <main className="main">
        <div className="content">
          <Skeleton className="skeleton-row" />
        </div>
      </main>
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
