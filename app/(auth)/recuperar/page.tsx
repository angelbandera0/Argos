import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { RecoverForm } from "./recuperar-form";

export const metadata: Metadata = { title: "Recuperar contraseña · Argos" };

export default function RecoverPage() {
  return (
    <Card>
      <div className="auth-title">
        <h1>Recuperar contraseña</h1>
        <p>Escribe tu correo y te enviaremos un enlace para restablecerla.</p>
      </div>
      <RecoverForm />
    </Card>
  );
}
