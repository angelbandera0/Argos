"use client";

import { Button } from "@/components/ui/button";
import { ViewState } from "@/components/ui/view-state";

export default function StockError({ reset }: { error: Error; reset: () => void }) {
  return <ViewState kind="error" entity="existencias" action={<Button variant="outline" onClick={reset}>Reintentar</Button>} />;
}
