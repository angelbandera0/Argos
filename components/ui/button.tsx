import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "icon";

export function Button({
  variant = "primary",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant}${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={props["aria-label"]}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
