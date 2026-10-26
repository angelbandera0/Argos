import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HistoryNav } from "@/components/history/history-nav";
import { HistoryPager } from "@/components/history/history-pager";
import { HistoryTable } from "@/components/history/history-table";
import { ENTITY_LABELS, HISTORY_MODULES, dateBounds, parseFilters } from "@/components/history/history-utils";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { actorNames, requireHistoryUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Historial · Argos" };

type Props = PageProps<"/historial/[modulo]">;

async function HistoryList({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { modulo } = await params;
  const { actor, history, users, companyId, isAdmin, modules } = await requireHistoryUser();
  if (!modules.includes(modulo)) notFound();
  if (actor.kind === "admin" && !companyId) {
    return <EmptyState icon="History" title="Elige una compañía arriba para ver su historial." />;
  }
  const filters = parseFilters(await searchParams);
  const people = await actorNames(users, companyId);
  const names = new Map(people.map((u) => [u.id, u.displayName]));
  let page;
  try {
    page = await history.listHistory(actor, { companyId, module: modulo, actorId: filters.actor, cursor: filters.cursor, ...dateBounds(filters) });
  } catch {
    return <Alert variant="danger">No se pudo cargar el historial. Inténtalo de nuevo.</Alert>;
  }
  const rows = page.items.map((e) => ({
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    actor: e.actorId ? (names.get(e.actorId) ?? "Usuario") : "Sistema",
    action: e.action,
    module: HISTORY_MODULES[e.module] ?? e.module,
    entity: ENTITY_LABELS[e.entityType] ?? e.entityType,
    entityId: e.entityId,
    channel: e.channel,
    before: e.before,
    after: e.after,
  }));
  const path = `/historial/${modulo}`;

  return (
    <>
      <HistoryNav modules={modules} current={modulo} access={isAdmin} />
      <Card>
        <ListToolbar
          action={path}
          filters={
            isAdmin && people.length > 0
              ? [
                  {
                    name: "usuario",
                    label: "Usuario",
                    options: [{ value: "", label: "Todos los usuarios" }, ...people.map((u) => ({ value: u.id, label: u.displayName }))],
                    defaultValue: filters.actor ?? "",
                  },
                ]
              : []
          }
          primary={
            <>
              <label className="sr-only" htmlFor="desde">Desde</label>
              <Input id="desde" name="desde" type="date" variant="outline" defaultValue={filters.from} />
              <label className="sr-only" htmlFor="hasta">Hasta</label>
              <Input id="hasta" name="hasta" type="date" variant="outline" defaultValue={filters.to} />
              <Link className={buttonClass("ghost", "md")} href={path}>
                Limpiar
              </Link>
            </>
          }
        />
        <HistoryTable rows={rows} />
      </Card>
      <HistoryPager path={path} filters={filters} nextCursor={page.nextCursor} />
    </>
  );
}

export default function ModuleHistoryPage(props: Props) {
  return (
    <div className="stack">
      <PageHeader title="Historial" description="Operaciones registradas, de la más reciente a la más antigua." />
      <Suspense fallback={<Loading />}>
        <HistoryList params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
