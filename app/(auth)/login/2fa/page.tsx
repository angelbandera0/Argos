import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import Loading from "./loading";
import { TwoFactorForm } from "./two-factor-form";

// The session read cannot be prerendered (T-04): opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Verificación en dos pasos · Argos" };

async function TwoFactor() {
  const hasTotp = await makeMfaGateway(await createServerClient()).hasTotp();
  if (!hasTotp) redirect("/primer-ingreso");
  return (
    <Card>
      <div className="auth-title">
        <h1>Verificación en dos pasos</h1>
        <p>Escribe el código de 6 dígitos de tu aplicación de autenticación.</p>
      </div>
      <TwoFactorForm />
    </Card>
  );
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TwoFactor />
    </Suspense>
  );
}
