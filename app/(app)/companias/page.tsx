import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2, Plus, Search } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { requireOrgUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Compañías · Argos" };

async function CompanyList({ searchParams }: { searchParams: PageProps<"/companias">["searchParams"] }) {
  const { actor, org } = await requireOrgUser();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().toLowerCase();
  const all = await org.listCompanies(actor);
  const companies = all.filter((c) => c.name.toLowerCase().includes(query) || c.code.includes(query));
  const canCreate = actor.kind === "admin";

  if (all.length === 0) {
    return (
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <Building2 />
        </span>
        <p>
          {canCreate
            ? "Aún no tienes compañías. Crea la primera para registrar sus sedes y tiendas."
            : "Aún no hay compañías registradas."}
        </p>
        {canCreate && (
          <Link className="btn btn-primary" href="/companias/nueva">
            <Plus aria-hidden="true" />
            Nueva compañía
          </Link>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <form className="search" role="search">
        <label className="sr-only" htmlFor="q">
          Buscar compañía
        </label>
        <Search aria-hidden="true" />
        <input id="q" name="q" type="search" defaultValue={q as string | undefined} placeholder="Buscar por nombre o código" />
      </form>
      {companies.length === 0 ? (
        <p className="muted">Ninguna compañía coincide con la búsqueda.</p>
      ) : (
        <ul className="list" aria-label="Compañías">
          {companies.map((c) => (
            <li key={c.id}>
              <Link className="list-row company-row" href={`/companias/${c.id}`}>
                <span className="icon-dot" aria-hidden="true">
                  <Building2 />
                </span>
                <strong>{c.name}</strong>
                <Chip variant="ring" className="mono">
                  {c.code}
                </Chip>
                {c.status === "active" ? <Chip variant="ring">Activa</Chip> : <Chip variant="alert">Desactivada</Chip>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function CompaniasPage(props: PageProps<"/companias">) {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Compañías</h1>
        <span className="spacer" />
        <Link className="btn btn-primary" href="/companias/nueva">
          <Plus aria-hidden="true" />
          Nueva compañía
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <CompanyList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
