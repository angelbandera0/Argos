"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
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
    <Dialog
      open
      title={`PIN nuevo de ${name}`}
      icon="KeyRound"
      dismissible={false}
      footer={
        <>
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "PIN copiado" : "Copiar PIN"}
          </Button>
          <Button disabled={!copied} onClick={onDone}>
            Ya lo copié
          </Button>
        </>
      }
    >
      <p className="secret-reveal pin-reveal" aria-label="PIN nuevo">
        {pin.slice(0, 3)} {pin.slice(3)}
      </p>
      <Alert variant="info" compact>
        Cópialo ahora y entrégaselo a {name}. Por seguridad <strong>no volverá a mostrarse</strong>.
      </Alert>
    </Dialog>
  );
}
