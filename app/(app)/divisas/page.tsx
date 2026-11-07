import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { CurrencyList } from "@/components/currencies/currency-list";
import { activeParam, parseStatusFilter } from "@/components/currencies/currency-list-logic";
import { Plus } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ACTIVE_COMPANY_COOKIE } from "../companias/guard";
import { requireCurrencyUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Divisas · Argos" };

const NewCurrencyLink = () => (
  <Link className={buttonClass("primary", "md")} href="/divisas/nueva">
    <Plus aria-hidden="true" />
    Nueva divisa
  </Link>
);

async function CurrencyListContent({ searchParams }: { searchParams: PageProps<"/divisas">["searchParams"] }) {
  const { actor, currencies, org } = await requireCurrencyUser();
  const { q, estado } = await searchParams;
  const text = typeof q === "string" ? q : "";
  const status = parseStatusFilter(estado);
  const companies = await org.listCompanies(actor);
  const cookieId = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
  const companyId = companies.find((c) => c.id === cookieId)?.id ?? companies[0]?.id;
  if (!companyId) {
    return <EmptyState icon="Building2" title="Aún no administras ninguna compañía." />;
  }

  let data;
  try {
    const [all, filtered] = await Promise.all([
      currencies.listCurrencies(actor, { companyId }),
      currencies.listCurrencies(actor, { companyId, active: activeParam(status), search: text }),
    ]);
    const rows = await Promise.all(
      filtered.map(async (c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        decimals: c.decimals,
        isDefault: c.isDefault,
        active: c.active,
        denominations: (await currencies.listDenominations(actor, { currencyId: c.id })).length,
      })),
    );
    data = { total: all.length, rows };
  } catch {
    return <Alert variant="danger">No se pudieron cargar las divisas. Recarga la página.</Alert>;
  }

  if (data.total === 0) {
    return (
      <EmptyState icon="Coins" title="Aún no tienes divisas." action={<NewCurrencyLink />}>
        Crea la primera para fijar los importes de tus pedidos.
      </EmptyState>
    );
  }

  return <CurrencyList q={text} status={status} rows={data.rows} />;
}

export default function CurrenciesPage(props: PageProps<"/divisas">) {
  return (
    <div className="stack">
      <PageHeader title="Divisas" description="Monedas de tu compañía y sus denominaciones." actions={<NewCurrencyLink />} />
      <Suspense fallback={<Loading />}>
        <CurrencyListContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
