import { progressPercent } from "./progress-logic";

export function ProgressBar({ value, max = 100, label, showValue = true }: { value: number; max?: number; label: string; showValue?: boolean }) {
  const pct = progressPercent(value, max);
  return (
    <div>
      <div className="progress-head">
        <span className="progress-label">{label}</span>
        {showValue && <span className="progress-value">{pct}%</span>}
      </div>
      <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
