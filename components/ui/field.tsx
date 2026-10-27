import { AlertCircle } from "lucide-react";

export { Input } from "./input";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        {label}
        {optional && <span className="field-optional"> (opcional)</span>}
      </label>
      {children}
      {hint && (
        <span className="hint" id={`${htmlFor}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="error-text" id={`${htmlFor}-error`} role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  );
}
