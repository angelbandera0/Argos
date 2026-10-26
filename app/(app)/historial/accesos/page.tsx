import type { Metadata } from "next";
import { Suspense } from "react";
import { HistoryNav } from "@/components/history/history-nav";
import { HistoryPager } from "@/components/history/history-pager";
import { AuthEventTable } from "@/components/history/history-table";
import { parseFilters } from "@/components/history/history-utils";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { actorNames, requireAccessAdmin } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Accesos · Argos" };

async function AuthEvents({ searchParams }: Pick<PageProps<"/historial/accesos">, "searchParams">) {
  const { actor, history, users, companyId, modules } = await requireAccessAdmin();
  if (actor.kind === "admin" && !companyId) {
    return <EmptyState icon="ShieldCheck" title="Elige una compañía arriba para ver sus accesos." />;
  }
  const filters = parseFilters(await searchParams);
  const names = new Map((await actorNames(users, companyId)).map((u) => [u.id, u.displayName]));
  let page;
  try {
    page = await history.listAuthEvents(actor, { companyId, cursor: filters.cursor });
  } catch {
    return <Alert variant="danger">No se pudieron cargar los eventos de acceso. Inténtalo de nuevo.</Alert>;
  }
  const rows = page.items.map((e) => ({
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    user: (e.userId && names.get(e.userId)) || e.usernameAttempted || "—",
    event: e.event,
    channel: e.channel,
  }));
  return (
    <>
      <HistoryNav modules={modules} current="accesos" access />
      <AuthEventTable rows={rows} />
      <HistoryPager path="/historial/accesos" filters={{ cursor: filters.cursor }} nextCursor={page.nextCursor} />
    </>
  );
}

export default function AccessPage(props: PageProps<"/historial/accesos">) {
  return (
    <div className="stack">
      <PageHeader title="Accesos" description="Inicios de sesión, bloqueos y cambios de credenciales." />
      <Suspense fallback={<Loading />}>
        <AuthEvents searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
