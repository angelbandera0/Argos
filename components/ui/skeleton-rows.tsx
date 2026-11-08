import { Skeleton } from "./skeleton";

const WIDTHS = [60, 48, 56, 44];

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-rows" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-row-item">
          <Skeleton variant="circle" onPanel />
          <div className="skeleton-row-lines">
            <Skeleton variant="text" onPanel style={{ width: `${WIDTHS[i % WIDTHS.length]}%` }} />
            <Skeleton variant="text" onPanel style={{ width: `${WIDTHS[i % WIDTHS.length] - 25}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
