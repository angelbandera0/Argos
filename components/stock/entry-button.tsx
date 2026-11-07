"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EntryDialog, type EntryCurrency, type EntryProduct } from "./entry-dialog";

export function EntryButton({ kind, variant, ...rest }: { kind: "initial" | "direct"; variant?: "secondary"; locationId: string; products: EntryProduct[]; productId?: string; costs: boolean; currencies: EntryCurrency[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>{kind === "initial" ? "Entrada inicial" : "Entrada directa"}</Button>
      {open && <EntryDialog kind={kind} {...rest} onClose={() => setOpen(false)} />}
    </>
  );
}
