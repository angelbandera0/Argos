import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { OperatorDashboard } from "@/components/dashboard/operator-dashboard";
import { readClaims } from "@/infrastructure/supabase/claims";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Inicio · Argos" };

async function Home() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims) return null;
  const profile = await makeUserRepository(supabase).getProfile(claims.userId);
  const first = (profile?.displayName ?? (claims.kind === "operator" ? "Operador" : claims.email)).split(" ")[0];
  const today = (new Date().getDay() + 6) % 7;
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Bienvenido/a de nuevo, {first}</h1>
      </div>
      <p className="caption">Vista con datos de ejemplo.</p>
      {claims.kind === "operator" ? <OperatorDashboard /> : <AdminDashboard today={today} />}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<Loading />}>
      <Home />
    </Suspense>
  );
}
