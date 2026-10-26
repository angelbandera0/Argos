"use client";

import { useState } from "react";

const LENGTH = 6;

export function CodeField({
  id,
  name,
  label,
  error = false,
  onValueChange,
}: {
  id: string;
  name: string;
  label: string;
  error?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const missing = LENGTH - value.length;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="code-boxes" data-error={error || undefined}>
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
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={LENGTH}
          autoComplete="one-time-code"
          autoFocus
          aria-describedby={`${id}-hint`}
          aria-invalid={error || undefined}
        />
        {Array.from({ length: LENGTH }, (_, i) => (
          <span
            key={i}
            className="code-cell"
            aria-hidden="true"
            data-active={i === value.length || undefined}
            data-filled={i < value.length || undefined}
          >
            {value[i]}
          </span>
        ))}
      </div>
      <span className="hint" id={`${id}-hint`}>
        {missing === 0 ? "Código completo." : `Faltan ${missing} ${missing === 1 ? "dígito" : "dígitos"}.`}
      </span>
    </div>
  );
}
