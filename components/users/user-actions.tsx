"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deactivateUserAction,
  resetPinAction,
  unlockUserAction,
  type ActionResult,
} from "@/app/(app)/usuarios/actions";
import { AlertCircle, Lock, LockOpen } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PinRevealDialog } from "./pin-reveal-dialog";

type Kind = "unlock" | "reset" | "deactivate";

const COPY: Record<Kind, { title: (n: string) => string; text: string; confirm: string; busy: string }> = {
  unlock: {
    title: (n) => `¿Desbloquear a ${n}?`,
    text: "Se genera un PIN nuevo y se cierran sus sesiones abiertas. El PIN nuevo se mostrará una sola vez.",
    confirm: "Desbloquear",
    busy: "Desbloqueando…",
  },
  reset: {
    title: (n) => `¿Generar un PIN nuevo para ${n}?`,
    text: "El PIN anterior dejará de funcionar y se cerrarán sus sesiones abiertas. El PIN nuevo se mostrará una sola vez.",
    confirm: "Generar PIN",
    busy: "Generando…",
  },
  deactivate: {
    title: (n) => `¿Desactivar a ${n}?`,
    text: "Dejará de poder entrar y se cerrarán sus sesiones abiertas. Su nombre de usuario no se podrá reutilizar.",
    confirm: "Desactivar usuario",
    busy: "Desactivando…",
  },
};

export function UserActions({ userId, name, status }: { userId: string; name: string; status: "active" | "locked" | "deactivated" }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [pin, setPin] = useState<string>();
  const first = name.split(/\s+/)[0] ?? name;

  if (status === "deactivated") return null;

  async function confirm() {
    if (!kind) return;
    setBusy(true);
    const run: Record<Kind, (id: string) => Promise<ActionResult>> = {
      unlock: unlockUserAction,
      reset: resetPinAction,
      deactivate: deactivateUserAction,
    };
    const r = await run[kind](userId);
    setBusy(false);
    if (r?.error) return setError(r.error);
    setKind(null);
    if (r?.pin) setPin(r.pin);
  }

  const ask = (k: Kind) => {
    setError(undefined);
    setKind(k);
  };
  const copy = kind ? COPY[kind] : null;

  return (
    <>
      {status === "locked" && (
        <Button onClick={() => ask("unlock")}>
          <LockOpen aria-hidden="true" />
          Desbloquear
        </Button>
      )}
      <Button variant="secondary" onClick={() => ask("reset")}>
        <Lock aria-hidden="true" />
        Cambiar PIN
      </Button>
      <Button variant="ghost" onClick={() => ask("deactivate")}>
        Desactivar usuario
      </Button>
      {kind && copy && (
        <Dialog open title={copy.title(first)} onClose={() => setKind(null)}>
          <p className="muted">{copy.text}</p>
          {error && (
            <p className="form-error" role="alert">
              <AlertCircle aria-hidden="true" />
              {error}
            </p>
          )}
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setKind(null)}>
              Cancelar
            </Button>
            <Button loading={busy} onClick={confirm}>
              {busy ? copy.busy : copy.confirm}
            </Button>
          </div>
        </Dialog>
      )}
      {pin && (
        <PinRevealDialog
          name={first}
          pin={pin}
          onDone={() => {
            setPin(undefined);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
