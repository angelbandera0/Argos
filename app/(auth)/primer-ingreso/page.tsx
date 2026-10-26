import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { readClaims } from "@/infrastructure/supabase/claims";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { signOutAdmin } from "../actions";
import Loading from "./loading";
import { PasswordStep } from "./password-step";
import { TotpStep } from "./totp-step";

// The session read cannot be prerendered (T-04): opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Primer ingreso · Argos" };

async function FirstLogin() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "operator") redirect("/login");
  if (!claims.mustChangePassword && (await makeMfaGateway(supabase).hasTotp())) {
    redirect(claims.aal === "aal2" ? "/companias" : "/login/2fa");
  }
  const password = claims.mustChangePassword;
  return (
    <Card>
      <div className="auth-title">
        <span className="overline">Paso {password ? 1 : 2} de 2</span>
        <h1>{password ? "Crea tu contraseña" : "Activa la verificación en dos pasos"}</h1>
        <p>
          {password
            ? "Reemplaza la contraseña temporal por una propia de al menos 12 caracteres."
            : "Escanea el código QR con una aplicación de autenticación y escribe el código que muestra."}
        </p>
      </div>
      {password ? <PasswordStep /> : <TotpStep />}
      <form className="auth-actions" action={signOutAdmin}>
        <button type="submit" className="btn btn-ghost">
          Salir
        </button>
      </form>
    </Card>
  );
}

export default function FirstLoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FirstLogin />
    </Suspense>
  );
}
