import { NAV_ICONS } from "@/components/icons";
import { stepState, type StepState } from "./nav-utils";

const { Check } = NAV_ICONS;

export type StepItem = { title: string; description?: string; content?: React.ReactNode };

const STATE_LABEL: Record<StepState, string> = {
  complete: "completado",
  current: "paso actual",
  pending: "pendiente",
  error: "con error",
};

export function Steps({
  steps,
  current,
  errorIndex,
  orientation = "horizontal",
  "aria-label": ariaLabel = "Pasos",
}: {
  steps: StepItem[];
  current: number;
  errorIndex?: number;
  orientation?: "horizontal" | "vertical";
  "aria-label"?: string;
}) {
  return (
    <ol className={`steps steps-${orientation === "vertical" ? "v" : "h"}`} aria-label={ariaLabel}>
      {steps.map((s, i) => {
        const state = stepState(i, current, errorIndex);
        return (
          <li key={`${i}|${s.title}`} className="step" data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <div className="step-rail">
              <span className="step-marker" aria-hidden="true">
                {state === "complete" ? <Check /> : state === "error" ? "!" : i + 1}
              </span>
              {i < steps.length - 1 && <span className="step-line" data-done={i < current || undefined} aria-hidden="true" />}
            </div>
            <div className="step-body">
              <span className="step-title">
                {s.title}
                <span className="sr-only"> ({STATE_LABEL[state]})</span>
              </span>
              {s.description && <span className="step-desc">{s.description}</span>}
              {orientation === "vertical" && state === "current" && s.content && <div className="step-content">{s.content}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
