"use client";

import { useState } from "react";

export function Textarea({
  variant = "filled",
  counter = false,
  className,
  onChange,
  ...props
}: React.ComponentProps<"textarea"> & { variant?: "filled" | "outline"; counter?: boolean }) {
  const [length, setLength] = useState(String(props.value ?? props.defaultValue ?? "").length);
  const cls = ["textarea", variant === "outline" && "textarea-outline", className].filter(Boolean).join(" ");
  return (
    <>
      <textarea
        className={cls}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        {...props}
      />
      {counter && props.maxLength && (
        <span className="hint ui-counter" aria-live="polite">
          {props.value !== undefined ? String(props.value).length : length}/{props.maxLength}
        </span>
      )}
    </>
  );
}
