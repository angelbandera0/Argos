"use client";

import { useNavRouter } from "@/components/ui/use-nav-router";
import { Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button-class";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityCard } from "@/components/ui/entity-card";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { CurrencyMenu } from "./currency-menu";
import { denominationsLabel, formatAmount, type StatusFilter } from "./currency-list-logic";

export type CurrencyRow = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isDefault: boolean;
  active: boolean;
  denominations: number;
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "activas", label: "Activas" },
  { value: "inactivas", label: "Inactivas" },
];

export function CurrencyList({ rows, q, status }: { rows: CurrencyRow[]; q: string; status: StatusFilter }) {
  const router = useNavRouter();
  const pathname = usePathname();
  const go = (estado: StatusFilter) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (estado) p.set("estado", estado);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <>
      <ListToolbar
        className="ui-companies-bar"
        submitLabel={false}
        search={{ label: "Buscar divisa", placeholder: "Buscar por código o nombre", defaultValue: q }}
        extra={
          <>
            {status && <input type="hidden" name="estado" value={status} />}
            <span className="ui-toolbar-sep" aria-hidden="true" />
            <div className="ui-toolbar-chips" role="group" aria-label="Estado">
              {FILTERS.map((f) => (
                <Chip key={f.value} pressed={status === f.value} onPressedChange={() => go(f.value)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <div className="ui-toolbar-end">
              <span className="caption">{rows.length} {rows.length === 1 ? "divisa" : "divisas"}</span>
            </div>
          </>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon="Search" title="Ninguna divisa coincide con la búsqueda.">
          Prueba con otro código, nombre o estado.
        </EmptyState>
      ) : (
        <div className="ui-entity-card-grid">
          {rows.map((r) => (
            <EntityCard
              key={r.id}
              avatar={r.code}
              codeBox
              avatarClassName={r.isDefault ? "co-tone-1" : undefined}
              title={<Link href={`/divisas/${r.id}`}>{r.name}</Link>}
              badge={<CurrencyMenu id={r.id} name={r.name} active={r.active} />}
              chip={
                <>
                  <Badge variant={r.active ? "success" : "neutral"}>{r.active ? "Activa" : "Inactiva"}</Badge>
                  {r.isDefault && <Badge variant="new" icon={<Star />}>Predeterminada</Badge>}
                </>
              }
              actions={
                <Link href={`/divisas/${r.id}`} className={`${buttonClass("outline", "md")} ui-entity-card-edit`}>
                  Editar divisa
                </Link>
              }
            >
              <dl className="ui-role-data">
                <div className="ui-role-pair">
                  <div>
                    <dt>Símbolo</dt>
                    <dd>{r.symbol}</dd>
                  </div>
                  <div>
                    <dt>Decimales</dt>
                    <dd>{r.decimals}</dd>
                  </div>
                </div>
                <div className="ui-role-pair">
                  <div>
                    <dt>Ejemplo</dt>
                    <dd>{r.symbol} {formatAmount(1234.5, r.decimals)}</dd>
                  </div>
                  <div>
                    <dt>Denominaciones</dt>
                    <dd>{denominationsLabel(r.denominations)}</dd>
                  </div>
                </div>
              </dl>
            </EntityCard>
          ))}
        </div>
      )}
    </>
  );
}
