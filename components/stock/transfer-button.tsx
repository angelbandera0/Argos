"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TransferDialog } from "./transfer-dialog";

export function TransferButton(props: Omit<React.ComponentProps<typeof TransferDialog>, "onClose">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Trasladar a tienda</Button>
      {open && <TransferDialog {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
