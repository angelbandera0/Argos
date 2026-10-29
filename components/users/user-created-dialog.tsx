"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PinSlots } from "@/components/ui/pin-slots";

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}` : (names[0] ?? ""));

export function UserCreatedDialog({
  name,
  username,
  pin,
  roleName,
  storeNames,
  userId,
  onAnother,
}: {
  name: string;
  username: string;
  pin: string;
  roleName: string;
  storeNames: string[];
  userId: string;
  onAnother: () => void;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(true);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copied, setCopied] = useState(false);
  const first = name.trim().split(/\s+/)[0] || "El usuario";

  async function copy(text: string, done: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      done(true);
    } catch {
      // Clipboard blocked: the values stay selectable in the dialog.
    }
  }

  return (
    <Dialog
      open
      dismissible={false}
      icon="Check"
      tone="success"
      title="Usuario creado"
      description={`${first} ya puede entrar en ${list(storeNames)} como ${roleName}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onAnother}>
            Crear otro
          </Button>
          <Button onClick={() => router.push(`/usuarios/${userId}`)}>Listo</Button>
        </>
      }
    >
      <div className="ui-created">
        <div className="ui-created-row">
          <div>
            <span className="hint">Usuario</span>
            <br />
            <code>{username}</code>
          </div>
          <Button variant="ghost" size="sm" onClick={() => copy(username, setCopiedUser)}>
            {copiedUser ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <hr />
        <div className="ui-created-row">
          <span className="hint">PIN generado</span>
          <Button variant="ghost" size="sm" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
            {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {shown ? "Ocultar" : "Mostrar"}
          </Button>
        </div>
        <PinSlots size="lg" value={pin} hidden={!shown} role="img" aria-label={shown ? `PIN ${pin.split("").join(" ")}` : "PIN oculto"} />
        <Button variant="secondary" onClick={() => copy(`Usuario: ${username}\nPIN: ${pin}`, setCopied)}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "PIN copiado" : "Copiar usuario y PIN"}
        </Button>
      </div>
      <Alert variant="warning" compact>
        <strong>Solo se muestra esta vez.</strong> Entrégaselo en persona. Si lo pierde, usa «Generar nuevo PIN» en su ficha.
      </Alert>
    </Dialog>
  );
}
