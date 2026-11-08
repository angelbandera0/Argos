import { Spinner } from "./spinner";

export function LoadingStatus({ children = "Cargando…" }: { children?: React.ReactNode }) {
  return (
    <div className="loading-status" role="status">
      <Spinner status />
      <span>{children}</span>
    </div>
  );
}
