const format = (n: number) => new Intl.NumberFormat("es", { maximumFractionDigits: 4 }).format(n);

export function DenominationRow({
  value,
  symbol,
  kind,
  inactive,
  note,
  className,
  children,
}: {
  value: number;
  symbol: string;
  kind: "bill" | "coin";
  inactive?: boolean;
  note?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`ui-denomination-row${className ? ` ${className}` : ""}`} data-inactive={inactive || undefined}>
      <span className="ui-denomination-tag" aria-hidden="true">
        {format(value)}
      </span>
      <div className="ui-denomination-text">
        <strong>{`${symbol} ${format(value)}`.trim()}</strong>
        <span className="hint">{note ?? (kind === "bill" ? "Billete" : "Moneda")}</span>
      </div>
      {children}
    </div>
  );
}
