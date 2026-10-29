"use client";

import { useState } from "react";
import { Store } from "@/components/icons";
import { Button } from "@/components/ui/button";

export type EntityPanelRow = { id: string; name: string; meta?: string; badge?: React.ReactNode; menu?: React.ReactNode };

export function EntityPanel({
  title,
  rows,
  action,
  empty,
  noun = "tiendas",
  limit = 2,
}: {
  title: string;
  rows: EntityPanelRow[];
  action?: React.ReactNode;
  empty: string;
  noun?: string;
  limit?: number;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, limit);
  return (
    <section className="ui-entity-panel" aria-label={title}>
      <div className="ui-entity-panel-head">
        <span className="ui-entity-panel-title">
          {title} · {rows.length}
        </span>
        {action}
      </div>
      {rows.length === 0 ? (
        <p className="ui-entity-panel-empty">{empty}</p>
      ) : (
        <ul className="ui-entity-panel-list">
          {shown.map((r) => (
            <li key={r.id} className="ui-entity-panel-row">
              <span className="ui-entity-panel-icon" aria-hidden="true">
                <Store />
              </span>
              <span className="ui-entity-panel-name">
                <strong>{r.name}</strong>
                {r.meta && <span>{r.meta}</span>}
              </span>
              {r.badge}
              {r.menu}
            </li>
          ))}
        </ul>
      )}
      {rows.length > limit && (
        <Button variant="ghost" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? "Ver menos" : `Ver las ${rows.length} ${noun}`}
        </Button>
      )}
    </section>
  );
}
