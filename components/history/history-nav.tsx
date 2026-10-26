import Link from "next/link";
import { buttonClass } from "@/components/ui/button-class";
import { HISTORY_MODULES } from "./history-utils";

/** Links per module plus «Accesos» (administrators only). */
export function HistoryNav({ modules, current, access }: { modules: string[]; current: string; access: boolean }) {
  const items = [
    ...modules.map((m) => ({ id: m, label: HISTORY_MODULES[m] ?? m, href: `/historial/${m}` })),
    ...(access ? [{ id: "accesos", label: "Accesos", href: "/historial/accesos" }] : []),
  ];
  if (items.length < 2) return null;
  return (
    <nav aria-label="Secciones del historial" className="row">
      {items.map((i) => (
        <Link
          key={i.id}
          className={buttonClass(i.id === current ? "primary" : "secondary", "sm")}
          href={i.href}
          aria-current={i.id === current ? "page" : undefined}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
