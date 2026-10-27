import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EnterForm } from "./enter-form";

export const metadata: Metadata = { title: "Entrar con PIN · Argos" };

export default function EnterPage() {
  return (
    <Card>
      <div className="auth-title">
        <h1>Entrar</h1>
        <p>Escribe tu usuario y tu PIN de seis dígitos.</p>
      </div>
      <EnterForm />
    </Card>
  );
}
