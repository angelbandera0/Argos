"use client";

import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grilla" | "lista";

export function ViewToggle({
  value,
  onValueChange,
  className,
}: {
  value: ViewMode;
  onValueChange: (value: ViewMode) => void;
  className?: string;
}) {
  return (
    <div className={`ui-view-toggle${className ? ` ${className}` : ""}`} role="group" aria-label="Vista">
      <button type="button" aria-pressed={value === "grilla"} aria-label="Vista de tarjetas" onClick={() => onValueChange("grilla")}>
        <LayoutGrid aria-hidden="true" />
      </button>
      <button type="button" aria-pressed={value === "lista"} aria-label="Vista de lista" onClick={() => onValueChange("lista")}>
        <List aria-hidden="true" />
      </button>
    </div>
  );
}
