import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { requireHistoryUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Historial · Argos" };

async function Entry() {
  const { modules, isAdmin } = await requireHistoryUser();
  if (modules.length === 0) notFound();
  return redirect(`/historial/${isAdmin || modules.length > 1 ? "todos" : modules[0]}`);
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Entry />
    </Suspense>
  );
}
