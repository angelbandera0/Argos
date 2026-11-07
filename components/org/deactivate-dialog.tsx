"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deactivateUnitAction, reactivateUnitAction } from "@/app/(app)/companias/actions";
import type { Level } from "@/core/application/ports/company-repository";
import { REASON_CODES, type ReasonCode } from "@/core/domain/deactivation";
import { Power } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { REASON_LABELS } from "./reasons";

const NOUN = { company: "compañía", site: "sede", store: "tienda" } as const;
const REASON_OPTIONS = REASON_CODES.map((c) => ({ value: c, label: REASON_LABELS[c] }));

function Submit({ label, busy, disabled }: { label: string; busy: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={disabled} loading={pending}>
      {pending ? busy : label}
    </Button>
  );
}

type Target = { level: Level; id: string; name: string; mode: "deactivate" | "reactivate" };

export function DeactivateModal({ level, id, name, mode, onClose }: Target & { onClose: () => void }) {
  const off = mode === "deactivate";
  const noun = NOUN[level];
  const verb = off ? "Desactivar" : "Reactivar";
  const toast = useToast();
  const [code, setCode] = useState<ReasonCode | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const needsText = !off || code === "otro";
  const ready = off ? code !== "" && (code !== "otro" || reason.trim() !== "") : reason.trim() !== "";

  async function submit() {
    const r = off
      ? await deactivateUnitAction(level, id, code as ReasonCode, reason)
      : await reactivateUnitAction(level, id, reason);
    if (r.error) return setError(r.error);
    toast.success(`${noun[0].toUpperCase()}${noun.slice(1)} ${name} ${off ? "desactivada" : "reactivada"}.`);
    onClose();
  }

  return (
    <Dialog open title={`¿Por qué ${off ? "desactivas" : "reactivas"} ${name}?`} onClose={onClose}>
      <form className="stack" action={submit}>
        {off && (
          <Field label="Motivo" htmlFor="reason-code">
            <Select
              id="reason-code"
              name="reason"
              options={REASON_OPTIONS}
              placeholder="Elige un motivo"
              value={code || null}
              onValueChange={(v) => setCode((v ?? "") as ReasonCode | "")}
            />
          </Field>
        )}
        {needsText && (
          <Field label={off ? "Cuéntanos el motivo" : "Motivo de la reactivación"} htmlFor="reason-text">
            <Textarea
              id="reason-text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              counter
            />
          </Field>
        )}
        {off && (
          <Alert variant="info" compact>
            Lo que cuelga de {name} dejará de ser accesible, pero cada nivel conserva su propio estado: si lo
            reactivas, volverán a operar los que estaban activos.
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Submit label={`${verb} ${noun}`} busy={off ? "Desactivando…" : "Reactivando…"} disabled={!ready} />
        </div>
      </form>
    </Dialog>
  );
}

export function DeactivateDialog({ disabledReason, ...target }: Target & { disabledReason?: string }) {
  const [open, setOpen] = useState(false);
  const verb = target.mode === "deactivate" ? "Desactivar" : "Reactivar";
  return (
    <>
      <Button
        variant="danger"
        disabled={!!disabledReason}
        aria-describedby={disabledReason ? `perm-${target.id}` : undefined}
        onClick={() => setOpen(true)}
      >
        <Power aria-hidden="true" />
        {verb} {NOUN[target.level]}
      </Button>
      {disabledReason && (
        <p className="hint" id={`perm-${target.id}`}>
          {disabledReason}
        </p>
      )}
      {open && <DeactivateModal {...target} onClose={() => setOpen(false)} />}
    </>
  );
}
