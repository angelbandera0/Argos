import type { Metadata } from "next";
import { Suspense } from "react";
import { ReasonsManager } from "@/components/stock/reasons-manager";
import { PageHeader } from "@/components/ui/page-header";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { requireStockUser } from "../guard";
import Loading from "../loading";

export const instant = false;
export const metadata: Metadata = { title: "Motivos de baja · Argos" };

async function Content() {
  const { actor, stock, companyId } = await requireStockUser();
  if (!companyId) return <ViewState kind="empty" entity="motivos" title="Elige una compañía arriba para ver sus motivos." canCreate={false} />;
  let all;
  try {
    all = await stock.listWriteOffReasons(actor, { companyId });
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="motivos" permission="Administrador" />;
    throw e;
  }
  return <ReasonsManager reasons={all.map((r) => ({ id: r.id, name: r.name, requiresText: r.requiresText, active: r.active, standard: r.standard }))} />;
}

export default function ReasonsPage() {
  return (
    <div className="stack">
      <PageHeader title="Motivos de baja" breadcrumbs={[{ label: "Existencias", href: "/existencias" }, { label: "Motivos de baja" }]} description="Los motivos entre los que se elige al dar de baja. Los estándar no se renombran ni se eliminan." />
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </div>
  );
}
