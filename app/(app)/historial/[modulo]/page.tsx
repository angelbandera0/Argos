import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryLoading } from "@/components/history/history-loading";
import { PageHeader } from "@/components/ui/page-header";
import { HistoryScreen } from "../history-screen";

export const instant = false;

export const metadata: Metadata = { title: "Historial · Argos" };

async function Section({ params, searchParams }: Pick<PageProps<"/historial/[modulo]">, "params" | "searchParams">) {
  const { modulo } = await params;
  return <HistoryScreen section={modulo} searchParams={searchParams} />;
}

export default function ModuleHistoryPage(props: PageProps<"/historial/[modulo]">) {
  return (
    <div className="stack">
      <PageHeader title="Historial" description="Operaciones registradas, de la más reciente a la más antigua." />
      <Suspense fallback={<HistoryLoading />}>
        <Section params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
