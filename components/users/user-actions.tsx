"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deactivateUserAction,
  resetPinAction,
  unlockUserAction,
  type ActionResult,
} from "@/app/(app)/usuarios/actions";
import { Lock, LockOpen } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PinRevealDialog } from "./pin-reveal-dialog";

export type Kind = "unlock" | "reset" | "deactivate";

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

/** Confirmation + one-time PIN for a user action; mounted by the user page and by the list. */
export function UserActionDialogs({
  userId,
  name,
  kind,
  onClose,
}: {
  userId: string;
  name: string;
  kind: Kind | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [pin, setPin] = useState<string>();
  const first = name.split(/\s+/)[0] ?? name;

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
    onClose();
    if (r?.pin) setPin(r.pin);
    else router.refresh();
  }

  const copy = kind ? COPY[kind] : null;
  return (
    <>
      {copy && (
        <AlertDialog
          open
          onClose={() => {
            setError(undefined);
            onClose();
          }}
          onConfirm={confirm}
          confirmLabel={busy ? copy.busy : copy.confirm}
          loading={busy}
          title={copy.title(first)}
          icon={kind === "deactivate" ? "Trash2" : "KeyRound"}
          tone={kind === "deactivate" ? "danger" : "warning"}
        >
          <p className="muted">{copy.text}</p>
          {error && <Alert variant="danger">{error}</Alert>}
        </AlertDialog>
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

export function UserActions({ userId, name, status }: { userId: string; name: string; status: "active" | "locked" | "deactivated" }) {
  const [kind, setKind] = useState<Kind | null>(null);
  if (status === "deactivated") return null;
  return (
    <>
      {status === "locked" && (
        <Button onClick={() => setKind("unlock")}>
          <LockOpen aria-hidden="true" />
          Desbloquear
        </Button>
      )}
      <Button variant="secondary" onClick={() => setKind("reset")}>
        <Lock aria-hidden="true" />
        Cambiar PIN
      </Button>
      <Button variant="ghost" onClick={() => setKind("deactivate")}>
        Desactivar usuario
      </Button>
      <UserActionDialogs userId={userId} name={name} kind={kind} onClose={() => setKind(null)} />
    </>
  );
}
