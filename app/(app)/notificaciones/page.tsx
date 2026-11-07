import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import Loading from "./loading";
import { NotificationsScreen } from "./notifications-screen";

export const instant = false;

export const metadata: Metadata = { title: "Notificaciones · Argos" };

export default function NotificationsPage(props: PageProps<"/notificaciones">) {
  return (
    <div className="stack">
      <PageHeader title="Notificaciones" description="Lo que ha pasado en tus compañías y tiendas." />
      <Suspense fallback={<Loading />}>
        <NotificationsScreen searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
