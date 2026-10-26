import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Argos" };

export default function LoginPage() {
  return (
    <Card>
      <div className="auth-title">
        <h1>Entrar</h1>
        <p>Acceso para administradores. Escribe tu correo y tu contraseña.</p>
      </div>
      <LoginForm />
    </Card>
  );
}
