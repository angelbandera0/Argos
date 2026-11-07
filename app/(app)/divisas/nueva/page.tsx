import type { Metadata } from "next";
import { Suspense } from "react";
import { CurrencyForm } from "@/components/currencies/currency-form";
import { DenominationManager } from "@/components/currencies/denomination-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireCurrencyUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Nueva divisa · Argos" };

async function Editor() {
  await requireCurrencyUser();
  return (
    <div className="stack">
      <CurrencyForm currencyId={null} initial={{ code: "", name: "", symbol: "", decimals: 2, isDefault: false, active: true }} />
      <DenominationManager currencyId={null} items={[]} />
    </div>
  );
}

export default function NewCurrencyPage() {
  return (
    <div className="stack">
      <PageHeader
        title="Nueva divisa"
        description="Define cómo se identifica y se muestra. Después añades sus denominaciones."
        breadcrumbs={[{ label: "Divisas", href: "/divisas" }, { label: "Nueva divisa" }]}
      />
      <Suspense fallback={<Loading />}>
        <Editor />
      </Suspense>
    </div>
  );
}
