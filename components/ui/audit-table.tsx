"use client";

import { Fragment, useState } from "react";
import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { Avatar } from "./avatar";
import { Badge } from "./badge";
import type { BadgeVariant } from "./feedback-utils";
import { LocalDateTime } from "./local-date-time";
import { Skeleton } from "./skeleton";

const { ChevronRight, ArrowRight } = NAV_ICONS;

export type AuditChange = { field: string; before: string; after: string };

export type AuditRowData = {
  id: string;
  /** ISO instant; the hour is formatted in the browser. */
  createdAt: string;
  /** null = the system. */
  actor: string | null;
  action: { label: string; variant: BadgeVariant };
  module?: string;
  entity?: { type: string; name?: string; id: string };
  channel: { key: string; label: string; icon: NavIconName };
  changes?: AuditChange[];
};

export type AuditGroup = { key: string; label: string; rows: AuditRowData[] };

function Channel({ row }: { row: AuditRowData }) {
  if (row.actor === null && row.channel.key === "system") return <span className="muted" aria-label="Sistema">—</span>;
  const Icon = NAV_ICONS[row.channel.icon];
  return (
    <span className="audit-channel">
      <Icon aria-hidden="true" />
      {row.channel.label}
    </span>
  );
}

function Changes({ id, changes }: { id: string; changes: AuditChange[] }) {
  return (
    <div className="audit-changes" id={`audit-changes-${id}`}>
      <table>
        <caption className="sr-only">Cambios por campo</caption>
        <thead>
          <tr>
            <th scope="col">Campo</th>
            <th scope="col">Antes</th>
            <th scope="col">
              <span className="sr-only">a</span>
            </th>
            <th scope="col">Después</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c) => (
            <tr key={c.field}>
              <th scope="row" className="mono">{c.field}</th>
              <td>
                <span className="audit-before">{c.before}</span>
              </td>
              <td className="audit-arrow">
                <ArrowRight aria-hidden="true" />
              </td>
              <td>
                <span className="audit-after">{c.after}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Audit table (DESIGN §6.36): rows grouped by day, columns Hora · Quién · Acción · Módulo · Entidad · Canal and an
 * expandable «Ver cambios» (Campo · Antes → Después). Data comes display-ready; `empty` fills the body without groups.
 */
export function AuditTable({
  label,
  groups,
  showModule = false,
  showEntity = true,
  actionHeader = "Acción",
  nouns = ["operación", "operaciones"],
  loading = false,
  empty,
  footer,
}: {
  label: string;
  groups: AuditGroup[];
  showModule?: boolean;
  showEntity?: boolean;
  actionHeader?: string;
  nouns?: [string, string];
  loading?: boolean;
  empty?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const cols = 5 + (showModule ? 1 : 0) + (showEntity ? 1 : 0);
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="dt audit" aria-busy={loading || undefined}>
      <div className="dt-scroll" tabIndex={0} role="region" aria-label={label}>
        <table>
          <thead>
            <tr>
              <th scope="col" className="audit-detail">
                <span className="sr-only">Detalle</span>
              </th>
              <th scope="col" className="dt-start eyebrow">Hora</th>
              <th scope="col" className="dt-start eyebrow">Quién</th>
              <th scope="col" className="dt-start eyebrow">{actionHeader}</th>
              {showModule && <th scope="col" className="dt-start eyebrow">Módulo</th>}
              {showEntity && <th scope="col" className="dt-start eyebrow">Entidad</th>}
              <th scope="col" className="dt-start eyebrow">Canal</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="dt-empty">
                  <td colSpan={cols}>
                    <Skeleton onPanel className="skeleton-row" />
                  </td>
                </tr>
              ))}
            {!loading && groups.length === 0 && (
              <tr className="dt-empty">
                <td colSpan={cols}>{empty}</td>
              </tr>
            )}
            {!loading &&
              groups.map((g) => (
                <Fragment key={g.key}>
                  <tr className="audit-group">
                    <th scope="rowgroup" colSpan={cols}>
                      <span className="eyebrow">{g.label}</span>
                      <span className="audit-group-count"> · {g.rows.length} {g.rows.length === 1 ? nouns[0] : nouns[1]}</span>
                    </th>
                  </tr>
                  {g.rows.map((r) => {
                    const expanded = open.has(r.id);
                    return (
                      <Fragment key={r.id}>
                        <tr className="audit-row" data-open={expanded || undefined}>
                          <td className="audit-detail">
                            {r.changes && (
                              <button
                                type="button"
                                className="audit-expand"
                                aria-expanded={expanded}
                                aria-controls={`audit-changes-${r.id}`}
                                aria-label={`${expanded ? "Ocultar" : "Ver"} cambios de ${r.entity?.name ?? r.entity?.type ?? r.action.label}`}
                                onClick={() => toggle(r.id)}
                              >
                                <ChevronRight aria-hidden="true" />
                              </button>
                            )}
                          </td>
                          <td className="audit-time">
                            <LocalDateTime value={r.createdAt} mode="time" />
                          </td>
                          <td>
                            <span className="audit-who">
                              <Avatar name={r.actor ?? "Sistema"} system={r.actor === null} />
                              {r.actor ?? "Sistema"}
                            </span>
                          </td>
                          <td>
                            <Badge variant={r.action.variant}>{r.action.label}</Badge>
                          </td>
                          {showModule && <td className="audit-soft">{r.module}</td>}
                          {showEntity && (
                            <td>
                              {r.entity && (
                                <span className="audit-entity">
                                  <span className="audit-soft">{r.entity.type}</span>
                                  {r.entity.name && <strong>{r.entity.name}</strong>}
                                  <span className="audit-id">{r.entity.id.slice(0, 8)}</span>
                                </span>
                              )}
                            </td>
                          )}
                          <td className="audit-soft">
                            <Channel row={r} />
                          </td>
                        </tr>
                        {expanded && r.changes && (
                          <tr className="audit-detail-row">
                            <td />
                            <td colSpan={cols - 1}>
                              <Changes id={r.id} changes={r.changes} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              ))}
          </tbody>
        </table>
      </div>
      {footer && <div className="dt-foot">{footer}</div>}
    </div>
  );
}
