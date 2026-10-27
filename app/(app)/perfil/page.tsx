import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Perfil · Argos" };

const ACCOUNT = { superadmin: "Superadmin", admin: "Administrador", operator: "Operador" } as const;

async function ProfileData() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims) notFound();
  const profile = await makeUserRepository(supabase).getProfile(claims.userId);
  const operator = claims.kind === "operator";
  const company =
    operator && profile?.companyId
      ? await makeCompanyRepository(supabase)
          .getById(profile.companyId)
          .catch(() => null)
      : null;
  const rows: [string, string | null | undefined][] = [
    ["Nombre", profile?.displayName],
    operator ? ["Usuario", profile?.username] : ["Correo", claims.email],
    ["Tipo de cuenta", ACCOUNT[claims.kind]],
    ...(operator ? [["Compañía", company?.name] as [string, string | undefined]] : []),
  ];
  return (
    <Card>
      <dl className="stack">
        {rows.map(([label, value]) => (
          <div key={label} className="field">
            <dt className="eyebrow">{label}</dt>
            <dd className="profile-value">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function PerfilPage() {
  return (
    <>
      <PageHeader title="Mi perfil" />
      <Suspense fallback={<Loading />}>
        <ProfileData />
      </Suspense>
    </>
  );
}
