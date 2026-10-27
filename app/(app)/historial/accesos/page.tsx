import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryLoading } from "@/components/history/history-loading";
import { PageHeader } from "@/components/ui/page-header";
import { HistoryScreen } from "../history-screen";

export const instant = false;

export const metadata: Metadata = { title: "Accesos · Argos" };

export default function AccessPage(props: PageProps<"/historial/accesos">) {
  return (
    <div className="stack">
      <PageHeader title="Accesos" description="Inicios de sesión, bloqueos y cambios de credenciales." />
      <Suspense fallback={<HistoryLoading />}>
        <HistoryScreen section="accesos" searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
