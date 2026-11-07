import { ViewState } from "@/components/ui/view-state";

export default function Loading() {
  return <ViewState kind="loading" entity="lotes" count={5} />;
}
