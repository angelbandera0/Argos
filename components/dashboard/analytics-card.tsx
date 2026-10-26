"use client";

import { useId } from "react";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { WEEKDAYS, type DemoSeries } from "@/app/(app)/_demo/dashboard-data";

const nf = new Intl.NumberFormat("es");

function Chart({ current, today }: { current: DemoSeries; today: number }) {
  const max = Math.max(...current.values);
  const top = Math.max(4, Math.ceil(max / 4) * 4);
  const best = current.values.indexOf(max);
  const ticks = [top, (top * 3) / 4, top / 2, top / 4, 0];
  const kind = (i: number) => (i === today ? "hoy" : i === best ? "mejor día" : "");

  return (
    <div className="stack">
      <ul className="legend" aria-label="Leyenda">
        <li><span className="swatch swatch-neutral" aria-hidden="true" />Altas por día ({current.unit})</li>
        <li><span className="swatch swatch-best" aria-hidden="true" />Mejor día</li>
        <li><span className="swatch swatch-today" aria-hidden="true" />Hoy</li>
      </ul>
      <div className="chart">
        <div className="chart-y" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ bottom: `${(t / top) * 100}%` }}>{nf.format(t)}</span>
          ))}
        </div>
        <div className="chart-plot">
          {ticks.map((t) => (
            <span key={t} className="chart-grid" aria-hidden="true" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <div className="chart-bars">
            {current.values.map((v, i) => (
              <div key={WEEKDAYS[i]} className="bar-col">
                {(i === today || i === best) && <span className="bar-value" aria-hidden="true">{nf.format(v)}</span>}
                <span
                  role="img"
                  aria-label={`${WEEKDAYS[i]}: ${nf.format(v)} ${current.unit}${kind(i) ? `, ${kind(i)}` : ""}`}
                  className={`bar${i === today ? " bar-today" : i === best ? " bar-best" : ""}`}
                  style={{ height: `${(v / top) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="chart-x" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            <span key={d} data-today={i === today ? "" : undefined}>{d}</span>
          ))}
        </div>
      </div>
      <details className="chart-table">
        <summary>Ver como tabla</summary>
        <table>
          <caption className="sr-only">Altas por día de la semana ({current.unit})</caption>
          <thead>
            <tr><th scope="col">Día</th><th scope="col">Altas</th></tr>
          </thead>
          <tbody>
            {current.values.map((v, i) => (
              <tr key={WEEKDAYS[i]}><th scope="row">{WEEKDAYS[i]}</th><td>{nf.format(v)}{kind(i) ? ` (${kind(i)})` : ""}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export function AnalyticsCard({ series, today }: { series: DemoSeries[]; today: number }) {
  const uid = useId();
  return (
    <Card className="dash-analytics" aria-labelledby={`${uid}-t`}>
      <div className="card-head">
        <h2 className="h2" id={`${uid}-t`}>Altas por semana</h2>
      </div>
      <Tabs
        aria-label="Qué se cuenta"
        defaultValue={series[0].id}
        items={series.map((s) => ({ value: s.id, label: s.label, content: <Chart current={s} today={today} /> }))}
      />
    </Card>
  );
}
