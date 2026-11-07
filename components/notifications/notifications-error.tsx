"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ViewState } from "@/components/ui/view-state";

export function NotificationsError() {
  const router = useRouter();
  return <ViewState kind="error" entity="notificaciones" action={<Button variant="outline" size="sm" onClick={() => router.refresh()}>Reintentar</Button>} />;
}
