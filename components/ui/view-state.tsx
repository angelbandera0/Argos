import { Alert } from "./alert";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";
import { supportLine, viewStateCopy, type ViewStateKind } from "./view-state-logic";

export type ViewStateProps = {
  kind: ViewStateKind;
  entity: string;
  title?: string;
  text?: string;
  action?: React.ReactNode;
  canCreate?: boolean;
  permission?: string;
  supportCode?: string;
  supportTime?: string;
  shape?: "rows" | "cards";
  count?: number;
};

export function ViewState({ kind, entity, title, text, action, canCreate = true, permission, supportCode, supportTime, shape = "rows", count = 4 }: ViewStateProps) {
  const copy = viewStateCopy(kind, entity, permission);
  if (kind === "loading") {
    return (
      <div role="status" aria-label={title ?? copy.title} className={`ui-view-state ui-view-loading ui-view-loading-${shape}`}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="ui-view-skel">
            <Skeleton variant="circle" />
            <Skeleton variant="title" />
            {shape === "cards" && <Skeleton variant="text" />}
          </div>
        ))}
      </div>
    );
  }
  if (kind === "error") {
    return (
      <div className="ui-view-state">
        <Alert variant="danger" title={title ?? copy.title} action={action}>
          {text ?? copy.text}
          {supportCode && <span className="ui-view-support">{supportLine(supportCode, supportTime)}</span>}
        </Alert>
      </div>
    );
  }
  const icon = kind === "forbidden" ? "Lock" : kind === "no-match" ? "Search" : "Inbox";
  const showAction = kind === "empty" ? canCreate && action : action;
  return (
    <div className="ui-view-state">
      <EmptyState icon={icon} title={title ?? copy.title} action={showAction}>
        {text ?? copy.text}
      </EmptyState>
    </div>
  );
}
