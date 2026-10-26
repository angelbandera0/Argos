import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { chipClass, type ChipVariant } from "./feedback-utils";

type Base = { variant?: ChipVariant; icon?: NavIconName; className?: string; children?: React.ReactNode };

export function Chip({
  variant,
  icon,
  className,
  children,
  pressed,
  onPressedChange,
  onRemove,
  removeLabel,
  ...props
}: Base &
  Omit<React.ComponentProps<"span">, keyof Base> & {
    pressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
    onRemove?: () => void;
    removeLabel?: string;
  }) {
  const Icon = icon && NAV_ICONS[icon];
  const content = (
    <>
      {pressed && <NAV_ICONS.Check aria-hidden="true" />}
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </>
  );
  if (pressed !== undefined) {
    return (
      <button
        type="button"
        className={chipClass({ variant, filter: true, className })}
        aria-pressed={pressed}
        onClick={() => onPressedChange?.(!pressed)}
      >
        {content}
      </button>
    );
  }
  return (
    <span className={chipClass({ variant, removable: !!onRemove, className })} {...props}>
      {content}
      {onRemove && (
        <button type="button" className="chip-remove" aria-label={removeLabel ?? "Quitar"} onClick={onRemove}>
          <NAV_ICONS.X aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
