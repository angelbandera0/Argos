import { Suspense } from "react";
import { Building2, ShieldCheck } from "@/components/icons";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { readClaims } from "@/infrastructure/supabase/claims";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";

const COMPANIES: NavItem = { id: "companias", label: "Compañías", href: "/companias", icon: Building2 };
const ADMINS: NavItem = {
  id: "administradores",
  label: "Administradores",
  href: "/superadmin/administradores",
  icon: ShieldCheck,
};

async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "operator") return children;
  const profile = await makeUserRepository(supabase).getProfile(claims.userId);
  const superadmin = claims.kind === "superadmin";
  return (
    <AppShell
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

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={null}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
