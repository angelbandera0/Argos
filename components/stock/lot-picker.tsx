"use client";

import { useEffect, useState } from "react";
import { type TransferPreview, previewTransferAction } from "@/app/(app)/existencias/transfer-actions";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Textarea } from "@/components/ui/textarea";
import type { Unit } from "@/core/domain/stock";
import { formatStockQty } from "./stock-list-logic";
import { type LotPick, type PreviewLot, packBreakdown, pendingBase, picksFrom, suggestedValues } from "./transfer-logic";

export type LotCurrency = { id: string; code: string };
export type LotChoice = { picks: LotPick[]; reason: string };

export const lotMoney = (c: PreviewLot["unitCost"], currencies: LotCurrency[]) =>
  c === undefined ? null : c === null ? "Sin costo conocido" : `${new Intl.NumberFormat("es", { maximumFractionDigits: 4 }).format(c.amount)} ${currencies.find((x) => x.id === c.currencyId)?.code ?? ""}`;

/** FIFO preview of a consumption with optional manual lot choice; reports picks/reason on change and the preview when it loads. */
export function LotPicker({
  id,
  productId,
  locationId,
  amount,
  unit,
  baseUnit,
  canChooseLot,
  currencies,
  onChange,
  onPreview,
}: {
  id: string;
  productId: string;
  locationId: string;
  amount: string;
  unit: string;
  baseUnit: string;
  canChooseLot: boolean;
  currencies: LotCurrency[];
  onChange: (c: LotChoice) => void;
  onPreview?: (p: TransferPreview | null) => void;
}) {
  const [choose, setChoose] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<TransferPreview | null>(null);

  const picks = choose ? picksFrom(values) : [];
  const picksKey = JSON.stringify(picks);
  const n = Number(amount.replace(",", "."));
  const valid = n > 0;

  useEffect(() => {
    if (!valid) return;
    let live = true;
    previewTransferAction({ productId, fromLocationId: locationId, qty: n, unit, picks: picksKey === "[]" ? undefined : JSON.parse(picksKey) }).then((p) => {
      if (!live) return;
      setPreview(p);
      onPreview?.(p);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, locationId, n, valid, unit, picksKey]);

  const emit = (nextChoose: boolean, nextValues: Record<string, string>, nextReason: string) => onChange({ picks: nextChoose ? picksFrom(nextValues) : [], reason: nextReason });

  const shown = valid ? preview : null;
  const fmt = (q: number) => formatStockQty(q, baseUnit as Unit);
  const pack = shown?.pack;
  const pending = !shown || !choose ? 0 : pack ? n - picks.reduce((a, p) => a + p.qty, 0) : pendingBase(picks, shown.baseQty);
  const suggested = new Set((shown?.suggestedPacks ?? shown?.suggested)?.map((s) => s.lotId));

  if (!shown) return null;
  return (
    <>
      {shown.error && <Alert variant="danger" compact>{shown.error}</Alert>}
      {!shown.error && (
        <>
          <p className="hint">
            {pack ? `${packBreakdown(shown.lots, shown.allocationPacks ?? [], pack.name, baseUnit)}.` : `Equivale a ${fmt(shown.baseQty)}.`} {choose ? "Lotes elegidos" : "Sale de los lotes más antiguos primero (FIFO)"}:
          </p>
          <ul className="stack">
            {shown.lots.map((l) => {
              const used = (pack ? shown.allocationPacks : shown.allocation)?.find((a) => a.lotId === l.id)?.qty ?? 0;
              const lotPacks = pack?.perLot.find((x) => x.lotId === l.id)?.packs ?? 0;
              const cost = lotMoney(l.unitCost, currencies);
              return (
                <li key={l.id} className="row">
                  <span className="mono">{l.id.slice(0, 8)}</span>
                  <LocalDateTime value={l.receivedAt} />
                  <span>Disponible {fmt(l.remaining)}{pack && (lotPacks > 0 ? ` (${lotPacks} completos de ${fmt(l.presentation?.content ?? 0)})` : " (no se puede mover por esta presentación)")}</span>
                  {cost && <span>Costo {cost}</span>}
                  {suggested.has(l.id) && <Chip>Sugerido</Chip>}
                  {choose && (!pack || lotPacks > 0) ? (
                    <Input
                      aria-label={`Cantidad del lote ${l.id.slice(0, 8)}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={pack ? 1 : "any"}
                      value={values[l.id] ?? ""}
                      onChange={(e) => {
                        const next = { ...values, [l.id]: e.target.value };
                        setValues(next);
                        emit(true, next, reason);
                      }}
                    />
                  ) : (
                    used > 0 && <strong>{pack ? `${used} ${pack.name.toLowerCase()} (${fmt(shown.allocation.find((a) => a.lotId === l.id)?.qty ?? 0)})` : fmt(used)}</strong>
                  )}
                </li>
              );
            })}
          </ul>
          {choose && pending !== 0 && <p className="hint">{pending > 0 ? `Faltan ${pack ? pending : fmt(pending)} por asignar.` : `Te pasas por ${pack ? -pending : fmt(-pending)}.`}</p>}
          {shown.isDeviation && (
            <>
              <Alert variant="warning" compact>No sale del lote más antiguo.</Alert>
              <Field label="Motivo" htmlFor={`${id}-reason`} optional>
                <Textarea
                  id={`${id}-reason`}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    emit(choose, values, e.target.value);
                  }}
                />
              </Field>
            </>
          )}
          {canChooseLot ? (
            <Checkbox
              label="Elegir lotes"
              description="Por defecto sale el lote más antiguo."
              checked={choose}
              onCheckedChange={(c) => {
                const next = c ? suggestedValues(shown.suggestedPacks ?? shown.suggested) : {};
                setChoose(c);
                setValues(next);
                emit(c, next, reason);
              }}
            />
          ) : (
            <p className="hint">Solo puedes seguir el lote más antiguo.</p>
          )}
        </>
      )}
    </>
  );
}
