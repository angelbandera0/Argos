"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { NAV_ICONS } from "@/components/icons";
import { Button } from "./button";
import { FilterPill } from "./filter-pill";
import {
  MONTHS, MONTHS_SHORT, WEEKDAYS, addDays, addMonths, clampIso, daysInMonth, endOfMonth, endOfWeek, formatDisplay, formatLong,
  formatShortRange, isDisabledDay, isValidIso, maskDisplay, monthMatrix, monthTitle, normalizeRange, parseDisplay, parseIso, pickRangeDay,
  presetRanges, rangeDays, startOfWeek, todayIso, toIso, typedRangeError, type DateRange, type Iso,
} from "./datepicker-utils";

export type { DateRange } from "./datepicker-utils";

const { Calendar: CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ArrowRight } = NAV_ICONS;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

type CalendarProps = {
  months: 1 | 2;
  initial: Iso;
  today: Iso;
  min?: Iso;
  max?: Iso;
  selected?: Iso;
  range?: DateRange;
  onPick: (iso: Iso) => void;
};

function Calendar({ months, initial, today, min, max, selected, range, onPick }: CalendarProps) {
  const p0 = parseIso(initial) ?? { y: 2000, m: 1, d: 1 };
  const [focus, setFocus] = useState(initial);
  const [view, setView] = useState({ y: p0.y, m: p0.m });
  const [mode, setMode] = useState<"days" | "months">("days");
  const [pickYear, setPickYear] = useState(p0.y);
  const root = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);

  const firstIso = toIso(view.y, view.m, 1);
  const lastMonth = addMonths(firstIso, months - 1).slice(0, 7);
  const canPrev = !min || firstIso.slice(0, 7) > min.slice(0, 7);
  const canNext = !max || lastMonth < max.slice(0, 7);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    root.current?.querySelector<HTMLElement>(`[data-iso="${focus}"]`)?.focus();
  }, [focus, view]);

  function show(iso: Iso) {
    const p = parseIso(iso);
    if (p) setView({ y: p.y, m: p.m });
  }

  function go(next: Iso) {
    const t = clampIso(next, min, max);
    setFocus(t);
    moveFocus.current = true;
    if (t.slice(0, 7) < firstIso.slice(0, 7)) show(t);
    else if (t.slice(0, 7) > lastMonth) show(addMonths(t, -(months - 1)));
  }

  function shift(delta: number) {
    setFocus(clampIso(addMonths(focus, delta), min, max));
    show(addMonths(firstIso, delta));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!(e.target as HTMLElement).dataset.iso) return;
    const step = e.shiftKey ? 12 : 1;
    const keys: Record<string, () => Iso> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => startOfWeek(focus),
      End: () => endOfWeek(focus),
      PageUp: () => addMonths(focus, -step),
      PageDown: () => addMonths(focus, step),
    };
    const next = keys[e.key]?.();
    if (!next) return;
    e.preventDefault();
    go(next);
  }

  function openMonths() {
    setPickYear(view.y);
    setMode("months");
  }

  function chooseMonth(m: number) {
    const day = Math.min(parseIso(focus)?.d ?? 1, daysInMonth(pickYear, m));
    setFocus(clampIso(toIso(pickYear, m, day), min, max));
    setView({ y: pickYear, m });
    setMode("days");
    moveFocus.current = true;
  }

  if (mode === "months") {
    return (
      <div className="dp-cal" ref={root}>
        <div className="dp-head">
          <button type="button" className="dp-nav" aria-label="Año anterior" disabled={!!min && pickYear <= (parseIso(min)?.y ?? 0)} onClick={() => setPickYear(pickYear - 1)}>
            <ChevronLeft aria-hidden="true" />
          </button>
          <span className="dp-title" aria-live="polite">{pickYear}</span>
          <button type="button" className="dp-nav" aria-label="Año siguiente" disabled={!!max && pickYear >= (parseIso(max)?.y ?? 9999)} onClick={() => setPickYear(pickYear + 1)}>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <div className="dp-months" role="group" aria-label={`Elegir mes de ${pickYear}`}>
          {MONTHS_SHORT.map((label, i) => {
            const first = toIso(pickYear, i + 1, 1);
            const off = isDisabledDay(endOfMonth(first), min, undefined) || isDisabledDay(first, undefined, max);
            return (
              <button
                key={label}
                type="button"
                className="dp-month-pill"
                disabled={off}
                aria-label={MONTHS[i]}
                aria-pressed={pickYear === view.y && i + 1 === view.m}
                data-current={today.slice(0, 7) === first.slice(0, 7) || undefined}
                onClick={() => chooseMonth(i + 1)}
              >
                {cap(label)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="dp-cal" ref={root} onKeyDown={onKeyDown}>
      <div className="sr-only" aria-live="polite">
        {Array.from({ length: months }, (_, i) => {
          const p = parseIso(addMonths(firstIso, i));
          return p ? monthTitle(p.y, p.m) : "";
        }).join(", ")}
      </div>
      <div className="dp-grids">
        {Array.from({ length: months }, (_, i) => {
          const p = parseIso(addMonths(firstIso, i)) ?? view;
          const title = monthTitle(p.y, p.m);
          return (
            <div className="dp-month" key={title}>
              <div className="dp-head">
                {i === 0 ? (
                  <button type="button" className="dp-nav" aria-label="Mes anterior" disabled={!canPrev} onClick={() => shift(-1)}>
                    <ChevronLeft aria-hidden="true" />
                  </button>
                ) : (
                  <span className="dp-nav-gap" />
                )}
                {months === 1 ? (
                  <span className="dp-title">
                    <button type="button" className="dp-title-btn" aria-label={`${cap(MONTHS[p.m - 1])}, elegir mes`} onClick={openMonths}>
                      {cap(MONTHS[p.m - 1])}
                      <ChevronDown aria-hidden="true" />
                    </button>
                    <button type="button" className="dp-title-btn" aria-label={`${p.y}, elegir año`} onClick={openMonths}>
                      {p.y}
                      <ChevronDown aria-hidden="true" />
                    </button>
                  </span>
                ) : (
                  <span className="dp-title">{title}</span>
                )}
                {i === months - 1 ? (
                  <button type="button" className="dp-nav" aria-label="Mes siguiente" disabled={!canNext} onClick={() => shift(1)}>
                    <ChevronRight aria-hidden="true" />
                  </button>
                ) : (
                  <span className="dp-nav-gap" />
                )}
              </div>
              <div role="grid" aria-label={title} className="dp-grid">
                <div role="row" className="dp-row">
                  {WEEKDAYS.map((w, wi) => (
                    <span key={w} role="columnheader" className="dp-weekday" aria-label={cap(["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"][wi])}>
                      {w}
                    </span>
                  ))}
                </div>
                {monthMatrix(p.y, p.m).map((week) => (
                  <div role="row" className="dp-row" key={week[0].iso}>
                    {week.map(({ iso, inMonth }) => {
                      if (!inMonth) return <div role="gridcell" className="dp-cell" key={iso} />;
                      const off = isDisabledDay(iso, min, max);
                      const end = range && (iso === range.from || iso === range.to);
                      const mid = !!range && !!range.to && iso > range.from && iso < range.to;
                      const on = iso === selected || !!end;
                      const band = mid ? "mid" : range && range.to > range.from && iso === range.from ? "start" : range && range.to > range.from && iso === range.to ? "end" : undefined;
                      return (
                        <div role="gridcell" className="dp-cell" key={iso} aria-selected={on || mid} data-band={band}>
                          <button
                            type="button"
                            className="dp-day"
                            data-iso={iso}
                            tabIndex={iso === focus ? 0 : -1}
                            disabled={off}
                            aria-label={`${formatLong(iso, today)}${off ? ", no disponible" : ""}`}
                            data-selected={on || undefined}
                            data-mid={mid || undefined}
                            data-today={iso === today || undefined}
                            onClick={() => {
                              setFocus(iso);
                              onPick(iso);
                            }}
                          >
                            {Number(iso.slice(8))}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateField({
  id,
  value,
  onCommit,
  min,
  max,
  invalid,
  disabled,
  placeholder = "dd/mm/aaaa",
  inputRef,
  onArrowDown,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: {
  id?: string;
  value: Iso;
  onCommit: (iso: Iso) => void;
  min?: Iso;
  max?: Iso;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  "aria-label"?: string;
  "aria-describedby"?: string;
  onArrowDown?: () => void;
}) {
  const [typed, setTyped] = useState<{ text: string; v: Iso } | null>(null);
  const live = typed && typed.v === value ? typed : null;
  const shown = live ? live.text : formatDisplay(value);
  const typedBad = !!live && live.text.length === 10 && value === "";

  return (
    <input
      id={id}
      ref={inputRef}
      className="dp-input"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      maxLength={10}
      value={shown}
      disabled={disabled}
      aria-invalid={invalid || typedBad || undefined}
      onChange={(e) => {
        const t = maskDisplay(e.target.value);
        const iso = parseDisplay(t);
        const next = iso && !isDisabledDay(iso, min, max) ? iso : "";
        setTyped({ text: t, v: next });
        onCommit(next);
      }}
      onBlur={() => {
        if (!typedBad) setTyped(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onArrowDown?.();
        }
      }}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
    />
  );
}

type BaseProps = {
  id?: string;
  min?: Iso;
  max?: Iso;
  invalid?: boolean;
  disabled?: boolean;
  today?: Iso;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

function PopupShell({
  open,
  onOpenChange,
  anchor,
  finalFocus,
  label,
  className,
  renderTrigger,
  children,
}: {
  renderTrigger?: () => React.ReactNode;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  anchor: React.RefObject<HTMLElement | null>;
  finalFocus: React.RefObject<HTMLElement | null>;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const popup = useRef<HTMLDivElement>(null);
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      {renderTrigger ? (
        renderTrigger()
      ) : (
        <Popover.Trigger className="dp-trigger" aria-label="Abrir calendario" data-open={open || undefined}>
          <CalendarIcon aria-hidden="true" />
        </Popover.Trigger>
      )}
      <Popover.Portal>
        <Popover.Positioner className="ui-positioner" anchor={anchor} sideOffset={8} align="start">
          <Popover.Popup
            ref={popup}
            className={`ui-popup dp-popup${className ? ` ${className}` : ""}`}
            aria-label={label}
            finalFocus={finalFocus}
            initialFocus={() => popup.current?.querySelector<HTMLElement>('.dp-day[tabindex="0"]') ?? true}
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export type DatepickerProps = BaseProps & {
  name?: string;
  value?: Iso;
  defaultValue?: Iso;
  onValueChange?: (value: Iso) => void;
  placeholder?: string;
};

export function Datepicker({
  id,
  name,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  min,
  max,
  invalid,
  disabled,
  today: todayProp,
  placeholder,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: DatepickerProps) {
  const [inner, setInner] = useState(isValidIso(defaultValue) ? defaultValue : "");
  const value = valueProp ?? inner;
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  function commit(v: Iso) {
    if (v === value) return;
    setInner(v);
    onValueChange?.(v);
  }

  return (
    <div className={`dp-field ui-control${className ? ` ${className}` : ""}`} ref={field} data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
      <DateField
        id={id}
        inputRef={input}
        value={value}
        onCommit={commit}
        min={min}
        max={max}
        invalid={invalid}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        onArrowDown={() => !disabled && setOpen(true)}
      />
      <PopupShell open={open && !disabled} onOpenChange={setOpen} anchor={field} finalFocus={input} label={ariaLabel ? `Elegir fecha: ${ariaLabel}` : "Elegir fecha"}>
        <SinglePanel
          value={value}
          min={min}
          max={max}
          today={todayProp ?? todayIso()}
          onSelect={(v) => {
            commit(v);
            setOpen(false);
          }}
        />
      </PopupShell>
    </div>
  );
}

function SinglePanel({ value, min, max, today, onSelect }: { value: Iso; min?: Iso; max?: Iso; today: Iso; onSelect: (v: Iso) => void }) {
  const initial = isValidIso(value) && !isDisabledDay(value, min, max) ? value : clampIso(today, min, max);
  return (
    <>
      <Calendar months={1} initial={initial} today={today} min={min} max={max} selected={value} onPick={onSelect} />
      <div className="dp-foot">
        <Button variant="ghost" size="sm" disabled={isDisabledDay(today, min, max)} onClick={() => onSelect(today)}>
          Hoy
        </Button>
        <Button variant="ghost" size="sm" disabled={!value} onClick={() => onSelect("")}>
          Borrar
        </Button>
      </div>
    </>
  );
}

export type DateRangePickerProps = BaseProps & {
  nameFrom?: string;
  nameTo?: string;
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (value: DateRange) => void;
  presets?: boolean;
  months?: 1 | 2;
  /** Filter-pill mode: a FilterPill trigger («Fechas: 20 – 26 oct 2026», ✕ to remove) instead of the two fields. */
  pill?: { label: string; emptyText?: string };
  "aria-label"?: string;
};

const EMPTY: DateRange = { from: "", to: "" };

export function DateRangePicker({
  id,
  nameFrom,
  nameTo,
  value: valueProp,
  defaultValue = EMPTY,
  onValueChange,
  min,
  max,
  invalid,
  disabled,
  today: todayProp,
  presets = true,
  months,
  pill,
  className,
  "aria-label": ariaLabel = "Rango de fechas",
  "aria-describedby": describedBy,
}: DateRangePickerProps) {
  const [inner, setInner] = useState<DateRange>(defaultValue);
  const value = valueProp ?? inner;
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const pillButton = useRef<HTMLButtonElement>(null);
  const reversed = typedRangeError(value.from, value.to);

  function commit(next: DateRange) {
    if (next.from === value.from && next.to === value.to) return;
    setInner(next);
    onValueChange?.(next);
  }

  if (pill) {
    const text =
      value.from && value.to
        ? formatShortRange(value.from, value.to)
        : value.from
          ? `Desde ${formatDisplay(value.from)}`
          : value.to
            ? `Hasta ${formatDisplay(value.to)}`
            : undefined;
    return (
      <PopupShell
        open={open && !disabled}
        onOpenChange={setOpen}
        anchor={pillRef}
        finalFocus={pillButton}
        label="Elegir rango de fechas"
        className="dp-popup-range"
        renderTrigger={() => (
          <FilterPill
            ref={pillRef}
            label={pill.label}
            emptyText={pill.emptyText ?? "Todas"}
            valueText={text}
            icon={<CalendarIcon aria-hidden="true" className="filter-icon" />}
            hideLabelWhenSet
            open={open}
            onClear={() => commit(EMPTY)}
            trigger={(content, className) => (
              <Popover.Trigger ref={pillButton} className={className} disabled={disabled}>
                {content}
              </Popover.Trigger>
            )}
          />
        )}
      >
        <RangePanel
          value={value}
          min={min}
          max={max}
          today={todayProp ?? todayIso()}
          presets={presets}
          months={months}
          onCancel={() => setOpen(false)}
          onApply={(r) => {
            commit(r);
            setOpen(false);
          }}
        />
      </PopupShell>
    );
  }

  return (
    <div
      className={`dp-field dp-field-range ui-control${className ? ` ${className}` : ""}`}
      ref={field}
      role="group"
      aria-label={ariaLabel}
      data-invalid={invalid || reversed || undefined}
      data-disabled={disabled || undefined}
    >
      {nameFrom && <input type="hidden" name={nameFrom} value={value.from} disabled={disabled} />}
      {nameTo && <input type="hidden" name={nameTo} value={value.to} disabled={disabled} />}
      <DateField
        id={id}
        inputRef={input}
        value={value.from}
        onCommit={(from) => commit({ ...value, from })}
        min={min}
        max={max}
        invalid={invalid || reversed}
        disabled={disabled}
        aria-label="Desde"
        aria-describedby={describedBy}
        onArrowDown={() => !disabled && setOpen(true)}
      />
      <ArrowRight className="dp-arrow" aria-hidden="true" />
      <DateField
        value={value.to}
        onCommit={(to) => commit({ ...value, to })}
        min={min}
        max={max}
        invalid={invalid || reversed}
        disabled={disabled}
        aria-label="Hasta"
        aria-describedby={describedBy}
        onArrowDown={() => !disabled && setOpen(true)}
      />
      <PopupShell open={open && !disabled} onOpenChange={setOpen} anchor={field} finalFocus={input} label="Elegir rango de fechas" className="dp-popup-range">
        <RangePanel
          value={value}
          min={min}
          max={max}
          today={todayProp ?? todayIso()}
          presets={presets}
          months={months}
          onCancel={() => setOpen(false)}
          onApply={(r) => {
            commit(r);
            setOpen(false);
          }}
        />
      </PopupShell>
    </div>
  );
}

function RangePanel({
  value,
  min,
  max,
  today,
  presets,
  months,
  onCancel,
  onApply,
}: {
  value: DateRange;
  min?: Iso;
  max?: Iso;
  today: Iso;
  presets: boolean;
  months?: 1 | 2;
  onCancel: () => void;
  onApply: (r: DateRange) => void;
}) {
  const [draft, setDraft] = useState<DateRange>(normalizeRange(value.from, value.to, min, max) ?? EMPTY);
  const [count] = useState<1 | 2>(() => months ?? (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches ? 2 : 1));
  const [anchor, setAnchor] = useState({ key: 0, iso: draft.from || clampIso(today, min, max) });
  const complete = !!draft.from && !!draft.to;
  const list = presetRanges(today);

  return (
    <div className="dp-range">
      {presets && (
        <div className="dp-presets" role="group" aria-label="Atajos">
          <span className="eyebrow dp-presets-title">Atajos</span>
          {list.map((p) => {
            const n = normalizeRange(p.from, p.to, min, max);
            return (
              <button
                key={p.id}
                type="button"
                className="dp-preset"
                disabled={!n}
                aria-pressed={!!n && n.from === draft.from && n.to === draft.to}
                onClick={() => {
                  if (!n) return;
                  setDraft(n);
                  setAnchor((a) => ({ key: a.key + 1, iso: n.from }));
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="dp-range-main">
        <Calendar key={anchor.key} months={count} initial={anchor.iso} today={today} min={min} max={max} range={draft} onPick={(iso) => setDraft(pickRangeDay(draft, iso))} />
        <div className="dp-foot dp-foot-range">
          <span className="dp-summary" aria-live="polite">
            {complete ? `${formatShortRange(draft.from, draft.to)} · ${rangeDays(draft.from, draft.to)} ${rangeDays(draft.from, draft.to) === 1 ? "día" : "días"}` : draft.from ? "Elige el día final" : "Elige el día inicial"}
          </span>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button size="sm" disabled={!complete} onClick={() => onApply(draft)}>
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
