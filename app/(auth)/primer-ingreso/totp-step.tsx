"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CodeField } from "@/components/ui/code-field";
import { Skeleton } from "@/components/ui/skeleton";
import { startTotpEnrollment, verifyTotp, type FormState } from "../actions";

type Enrollment = { factorId: string; qrCode: string; secret: string };

export function TotpStep() {
  const [enrollment, setEnrollment] = useState<Enrollment | null | undefined>(undefined);
  const [state, action, pending] = useActionState<FormState, FormData>(verifyTotp, {});
  const [code, setCode] = useState("");

  useEffect(() => {
    let current = true;
    startTotpEnrollment().then((e) => current && setEnrollment(e));
    return () => {
      current = false;
    };
  }, []);

  if (enrollment === undefined) {
    return (
      <div className="auth-form" aria-busy="true">
        <span className="sr-only">Cargando…</span>
        <Skeleton onPanel className="qr" />
        <Skeleton variant="pill" onPanel />
      </div>
    );
  }
  if (enrollment === null) {
    return (
      <Alert variant="danger">No se pudo generar el código QR. Recarga la página para intentarlo de nuevo.</Alert>
    );
  }
  return (
    <form className="auth-form" action={action}>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URI returned by Supabase */}
      <img className="qr" src={enrollment.qrCode} alt="Código QR para tu aplicación de autenticación" />
      <p className="hint">
        ¿No puedes escanearlo? Escribe esta clave en tu aplicación: <span className="secret">{enrollment.secret}</span>
      </p>
      <input type="hidden" name="factorId" value={enrollment.factorId} />
      <CodeField id="code" name="code" label="Código de verificación" error={!!state.error} onValueChange={setCode} />
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <Button type="submit" loading={pending} disabled={code.length < 6}>
        {pending ? "Verificando…" : "Verificar y continuar"}
      </Button>
    </form>
  );
}
