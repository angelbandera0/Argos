"use client";

import { useState } from "react";

const TABS = [
  { id: "stores", label: "Tiendas y rol" },
  { id: "activity", label: "Actividad" },
] as const;

export function UserTabs({ stores, activity }: { stores: React.ReactNode; activity: React.ReactNode }) {
  const [active, setActive] = useState(0);
  return (
    <div className="stack">
      <div className="tabs" role="tablist" aria-label="Secciones del usuario">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === i}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setActive((active + 1) % TABS.length);
              if (e.key === "ArrowLeft") setActive((active + TABS.length - 1) % TABS.length);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {TABS.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== i}>
          {i === 0 ? stores : activity}
        </div>
      ))}
    </div>
  );
}
