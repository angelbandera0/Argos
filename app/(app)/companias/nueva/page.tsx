import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireOrgUser } from "../guard";
import Loading from "./loading";
import { NewCompanyForm } from "./new-company-form";

export const instant = false;

export const metadata: Metadata = { title: "Nueva compañía · Argos" };

async function Guarded() {
  const { actor } = await requireOrgUser();
  if (actor.kind !== "admin") notFound();
  return <NewCompanyForm />;
}

export default function NewCompanyPage() {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Nueva compañía</h1>
      </div>
      <Suspense fallback={<Loading />}>
        <Guarded />
      </Suspense>
    </>
  );
}
