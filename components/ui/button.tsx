import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-class";
import { Spinner } from "./spinner";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  iconLeft,
  iconRight,
  className,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={props["aria-label"]}
      {...props}
    >
      {loading ? <Spinner /> : iconLeft}
      {loadingLabel ? (
        <span className="btn-swap">
          <span className={loading ? "btn-swap-off" : undefined} aria-hidden={loading || undefined}>{children}</span>
          <span className={loading ? undefined : "btn-swap-off"} aria-hidden={!loading || undefined}>{loadingLabel}</span>
        </span>
      ) : (
        children
      )}
      {iconRight}
    </button>
  );
}
