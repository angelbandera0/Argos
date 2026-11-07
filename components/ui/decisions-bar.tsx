"use client";

import { Button } from "./button";
import { decisionsSummary, decisionsTotal, type Decisions } from "./decisions-logic";

export function DecisionsBar({
  decisions,
  onUndo,
  onApply,
  pending,
}: {
  decisions: Decisions;
  onUndo: () => void;
  onApply: () => void;
  pending?: boolean;
}) {
  if (decisionsTotal(decisions) === 0) return null;
  return (
    <div className="ui-decisions-bar" role="region" aria-label="Decisiones pendientes">
      <p className="ui-decisions-text">{decisionsSummary(decisions)}</p>
      <Button variant="outline" className="ui-decisions-undo" onClick={onUndo} disabled={pending}>
        Deshacer todo
      </Button>
      <Button onClick={onApply} loading={pending}>
        Aplicar<span className="ui-decisions-long"> decisiones</span>
      </Button>
    </div>
  );
}
