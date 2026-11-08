export function Spinner({ status = false }: { status?: boolean }) {
  return <span className={status ? "spinner spinner-status" : "spinner"} aria-hidden="true" />;
}
