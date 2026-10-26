"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deactivateUnitAction, reactivateUnitAction } from "@/app/(app)/companias/actions";
import type { Level } from "@/core/application/ports/company-repository";
import { REASON_CODES, type ReasonCode } from "@/core/domain/deactivation";
import { AlertCircle, Info, Power } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { REASON_LABELS } from "./reasons";

function Submit({ label, busy, disabled }: { label: string; busy: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled} loading={pending}>
      {pending ? busy : label}
    </Button>
  );
}

export function DeactivateDialog({
  level,
  id,
  name,
  mode,
  disabledReason,
  compact = false,
}: {
  level: Level;
  id: string;
  name: string;
  mode: "deactivate" | "reactivate";
  disabledReason?: string;
  compact?: boolean;
}) {
  const off = mode === "deactivate";
  const noun = { company: "compañía", site: "sede", store: "tienda" }[level];
  const verb = off ? "Desactivar" : "Reactivar";
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<ReasonCode | "">("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const needsText = !off || code === "otro";
  const ready = off ? code !== "" && (code !== "otro" || reason.trim() !== "") : reason.trim() !== "";

  async function submit() {
    const r = off
      ? await deactivateUnitAction(level, id, code as ReasonCode, reason)
      : await reactivateUnitAction(level, id, reason);
    if (r.error) setError(r.error);
    else setOpen(false);
  }

  return (
    <>
      {compact ? (
        <Button
          variant="icon"
          aria-label={`${verb} ${noun} ${name}`}
          onClick={() => {
            setCode("");
            setReason("");
            setError(undefined);
            setOpen(true);
          }}
        >
          <Power aria-hidden="true" />
        </Button>
      ) : (
        <>
          <Button
            disabled={!!disabledReason}
            aria-describedby={disabledReason ? `perm-${id}` : undefined}
            onClick={() => {
              setCode("");
              setReason("");
              setError(undefined);
              setOpen(true);
            }}
          >
            <Power aria-hidden="true" />
            {verb} {noun}
          </Button>
          {disabledReason && (
            <p className="hint" id={`perm-${id}`}>
              {disabledReason}
            </p>
          )}
        </>
      )}
      {open && (
        <Dialog open title={`¿Por qué ${off ? "desactivas" : "reactivas"} ${name}?`} onClose={() => setOpen(false)}>
          <form className="stack" action={submit}>
            {off && (
              <fieldset className="reasons">
                <legend className="sr-only">Motivo</legend>
                {REASON_CODES.map((c) => (
                  <label className="reason" key={c}>
                    <input type="radio" name="reason" value={c} checked={code === c} onChange={() => setCode(c)} />
                    {REASON_LABELS[c]}
                  </label>
                ))}
              </fieldset>
            )}
            {needsText && (
              <div className="field">
                <label htmlFor="reason-text">{off ? "Cuéntanos el motivo" : "Motivo de la reactivación"}</label>
                <textarea
                  id="reason-text"
                  className="textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                />
              </div>
            )}
            {off && (
              <div className="notice">
                <Info aria-hidden="true" />
                <p>
                  Lo que cuelga de {name} dejará de ser accesible, pero cada nivel conserva su propio estado: si lo
                  reactivas, volverán a operar los que estaban activos.
                </p>
              </div>
            )}
            {error && (
              <p className="form-error" role="alert">
                <AlertCircle aria-hidden="true" />
                {error}
              </p>
            )}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Submit label={`${verb} ${noun}`} busy={off ? "Desactivando…" : "Reactivando…"} disabled={!ready} />
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
