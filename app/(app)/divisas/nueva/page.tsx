import type { Metadata } from "next";
import { Suspense } from "react";
import { CurrencyForm } from "@/components/currencies/currency-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireCurrencyUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Nueva divisa · Argos" };

async function Editor() {
  await requireCurrencyUser();
  return (
    <CurrencyForm currencyId={null} initial={{ code: "", name: "", symbol: "", decimals: 2, isDefault: false, active: true }} />
  );
}

export default function NewCurrencyPage() {
  return (
    <div className="stack">
      <PageHeader
        title="Nueva divisa"
        description="Define cómo se identifica y se muestra, y sus billetes y monedas."
        breadcrumbs={[{ label: "Divisas", href: "/divisas" }, { label: "Nueva divisa" }]}
      />
      <Suspense fallback={<Loading />}>
        <Editor />
      </Suspense>
    </div>
  );
}
