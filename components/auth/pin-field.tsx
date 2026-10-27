"use client";

import { useId, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "@/components/icons";

const LENGTH = 6;

export function PinField({
  name,
  label,
  error,
  onValueChange,
}: {
  name: string;
  label: string;
  error?: string;
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [shown, setShown] = useState(false);
  const missing = LENGTH - value.length;
  const hint = missing === 0 ? "PIN completo." : `Faltan ${missing} ${missing === 1 ? "dígito" : "dígitos"}.`;
  return (
    <div className="field">
      <div className="pin-head">
        <label htmlFor={id}>{label}</label>
        <button type="button" className="pin-toggle" aria-pressed={shown} onClick={() => setShown((s) => !s)}>
          {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {shown ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <div className="code-boxes pin-boxes" data-error={error ? true : undefined}>
        <input
          className="code-input"
          id={id}
          name={name}
          value={value}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, LENGTH);
            setValue(next);
            onValueChange?.(next);
          }}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={LENGTH}
          autoComplete="one-time-code"
          aria-describedby={`${id}-hint`}
          aria-invalid={error ? true : undefined}
        />
        {Array.from({ length: LENGTH }, (_, i) => (
          <span
            key={i}
            className="code-cell"
            aria-hidden="true"
            data-active={i === value.length || undefined}
            data-filled={i < value.length || undefined}
          >
            {i < value.length ? shown ? value[i] : <span className="pin-dot" /> : <span className="pin-cursor" />}
          </span>
        ))}
      </div>
      <span className="hint" id={`${id}-hint`}>
        {hint}
      </span>
      {error && (
        <p className="form-error" role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
