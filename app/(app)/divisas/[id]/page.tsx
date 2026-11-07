import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CurrencyForm } from "@/components/currencies/currency-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { NotFound } from "@/core/domain/errors";
import { requireCurrencyUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Editar divisa · Argos" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Editor({ params }: { params: PageProps<"/divisas/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { actor, currencies } = await requireCurrencyUser();
  let currency;
  try {
    currency = await currencies.getCurrency(actor, { id });
  } catch (e) {
    if (e instanceof NotFound) notFound();
    return <Alert variant="danger">No se pudo cargar la divisa. Recarga la página.</Alert>;
  }
  const { denominations, ...initial } = currency;
  return (
    <div className="stack">
      <PageHeader
        title="Editar divisa"
        description="Cambia cómo se escriben los montos y qué billetes y monedas existen."
        breadcrumbs={[{ label: "Divisas", href: "/divisas" }, { label: currency.code }]}
      />
      <CurrencyForm currencyId={currency.id} initial={initial} denominations={denominations} />
    </div>
  );
}

export default function EditCurrencyPage(props: PageProps<"/divisas/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Editor params={props.params} />
    </Suspense>
  );
}
