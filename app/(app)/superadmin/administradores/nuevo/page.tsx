import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSuperadmin } from "../../guard";
import Loading from "./loading";
import { NewAdminForm } from "./new-admin-form";

export const instant = false;

export const metadata: Metadata = { title: "Nuevo administrador · Argos" };

async function Guarded() {
  await requireSuperadmin();
  return <NewAdminForm />;
}

export default function NewAdminPage() {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Nuevo administrador</h1>
      </div>
      <Suspense fallback={<Loading />}>
        <Guarded />
      </Suspense>
    </>
  );
}
