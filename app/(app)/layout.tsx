import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { CompanySelectorProps } from "@/components/org/company-selector";
import { TimeZoneSync } from "@/components/shell/time-zone-sync";
import { StoreSwitcher } from "@/components/shell/store-switcher";
import { BellFallback, BellSlot } from "@/components/notifications/bell-slot";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/shell/app-shell";
import { buildNav } from "@/components/shell/nav-config";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeOrg } from "@/infrastructure/supabase/org-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { ACTIVE_COMPANY_COOKIE } from "./companias/guard";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import { makeUsers } from "@/infrastructure/supabase/users-factory";

const bell = (
  <Suspense fallback={<BellFallback />}>
    <BellSlot />
  </Suspense>
);

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
      bell={bell}
      top={
        <div className="op-bar">
          <StoreSwitcher
            activeId={active.storeId}
            stores={stores.map((s) => ({ id: s.storeId, name: s.storeName, site: s.siteName, available: s.operational }))}
          />
        </div>
      }
      nav={buildNav({ kind: "operator", permissions: active.permissions })}
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
  let company: CompanySelectorProps | undefined;
  if (claims.kind === "admin" && claims.aal === "aal2" && !claims.mustChangePassword) {
    const companies = await makeOrg(supabase).listCompanies({ userId: claims.userId, kind: "admin", channel: "ui" });
    const cookieId = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
    const activeId = companies.some((c) => c.id === cookieId) ? cookieId : undefined;
    if (companies.length > 0) {
      company = { companies: companies.map((c) => ({ id: c.id, name: c.name, code: c.code })), activeId };
    }
  }
  return (
    <AppShell
      bell={bell}
      company={company}
      nav={buildNav({ kind: superadmin ? "superadmin" : "admin" })}
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
    <>
      <TimeZoneSync />
      <Suspense fallback={<ShellSkeleton />}>
        <Shell>{children}</Shell>
      </Suspense>
    </>
  );
}
