"use client";

import { useState } from "react";
import { Check, Copy, Info } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function PinRevealDialog({ name, pin, onDone }: { name: string; pin: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
    } catch {
      // Clipboard blocked: the PIN stays selectable in the dialog.
    }
  }

  return (
    <Dialog open title={`PIN nuevo de ${name}`} dismissible={false}>
      <p className="secret-reveal pin-reveal" aria-label="PIN nuevo">
        {pin.slice(0, 3)} {pin.slice(3)}
      </p>
      <div className="notice">
        <Info aria-hidden="true" />
        <p>
          Cópialo ahora y entrégaselo a {name}. Por seguridad <strong>no volverá a mostrarse</strong>.
        </p>
      </div>
      <div className="modal-actions">
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "PIN copiado" : "Copiar PIN"}
        </Button>
        <Button disabled={!copied} onClick={onDone}>
          Ya lo copié
        </Button>
      </div>
    </Dialog>
  );
}
