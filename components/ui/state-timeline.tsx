import { ArrowLeft, Check, Clock } from "lucide-react";

export type TimelineState = "done" | "now" | "returned" | "confirmed" | "upcoming";
export type TimelineStep = { title: string; state: TimelineState; meta?: string; note?: string };

const ICONS = { done: Check, now: Clock, returned: ArrowLeft, confirmed: Check, upcoming: null } as const;

export function StateTimeline({ steps, orientation = "horizontal" }: { steps: TimelineStep[]; orientation?: "horizontal" | "vertical" }) {
  return (
    <ol className={`ui-timeline ui-timeline-${orientation}`}>
      {steps.map((s, i) => {
        const Icon = ICONS[s.state];
        return (
          <li key={`${i}-${s.title}`} className="ui-timeline-step" aria-current={s.state === "now" ? "step" : undefined}>
            <span className={`ui-timeline-dot ui-timeline-${s.state}`} aria-hidden="true">
              {Icon && <Icon />}
            </span>
            <div className="ui-timeline-body">
              <div className="ui-timeline-title">{s.title}</div>
              {s.meta && <div className="ui-timeline-meta">{s.meta}</div>}
              {s.note && orientation === "vertical" && <blockquote className="ui-timeline-note">“{s.note}”</blockquote>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
