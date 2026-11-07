import { STATUS_BADGES, StatusBadge, type StatusBadgeProps } from "@/components/ui/status-badge";
import { Specimen } from "../gallery";

const FAMILIES: [keyof typeof STATUS_BADGES, string][] = [
  ["stock", "Existencia"],
  ["line", "Línea de solicitud"],
  ["request", "Solicitud"],
  ["order", "Pedido"],
];

export function StatusBadgeSection() {
  return (
    <>
      {FAMILIES.map(([family, title]) => (
        <Specimen key={family} title={title}>
          <div className="ui-row">
            {Object.keys(STATUS_BADGES[family]).map((status) => (
              <StatusBadge key={status} {...({ family, status } as StatusBadgeProps)} />
            ))}
          </div>
        </Specimen>
      ))}
    </>
  );
}
