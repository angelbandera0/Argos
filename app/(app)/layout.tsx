import { cookies } from "next/headers";
import { Suspense } from "react";
import { CompanySelector } from "@/components/org/company-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeOrg } from "@/infrastructure/supabase/org-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { ACTIVE_COMPANY_COOKIE } from "./companias/guard";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";

const COMPANIES: NavItem = { id: "companias", label: "Compañías", href: "/companias", icon: "Building2" };
const ADMINS: NavItem = {
  id: "administradores",
  label: "Administradores",
  href: "/superadmin/administradores",
  icon: "ShieldCheck",
};

async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "operator") return children;
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
      nav={superadmin ? [ADMINS, COMPANIES] : [COMPANIES]}
      user={{
        name: profile?.displayName ?? claims.email,
        role: superadmin ? "Superadmin" : "Administrador",
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
