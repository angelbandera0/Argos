import type { HTMLAttributes } from "react";

export type PinSlotsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Digits shown; without it the slots are empty (dotted). */
  value?: string;
  /** Masks the digits as "•". */
  hidden?: boolean;
  size?: "sm" | "lg";
};

/** Six PIN boxes: dotted placeholders, or digits (masked or not). */
export function PinSlots({ value, hidden, size = "sm", className, ...props }: PinSlotsProps) {
  return (
    <div
      className={`ui-pin-slots ui-pin-slots-${size}${className ? ` ${className}` : ""}`}
      data-empty={!value || undefined}
      {...props}
    >
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="ui-pin-slot" aria-hidden="true">
          {value ? (hidden ? "•" : value[i]) : null}
        </span>
      ))}
    </div>
  );
}
