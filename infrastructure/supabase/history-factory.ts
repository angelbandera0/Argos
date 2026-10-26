import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeCountAuthEvents, makeCountHistory } from "@/core/application/use-cases/history/count-history";
import { makeListAuthEvents } from "@/core/application/use-cases/history/list-auth-events";
import { makeListHistory } from "@/core/application/use-cases/history/list-history";
import { makeCompanyRepository } from "./company-repository";
import { makeHistoryReader } from "./history-reader";
import { makeSessionRepository } from "./session-repository";
import { makeStoreAccessReader } from "./store-access-reader";

const clock = { now: () => new Date() };

/** History use cases bound to one request's user client (RLS applies). */
export function makeHistory(supabase: SupabaseClient) {
  const deps = {
    history: makeHistoryReader(supabase),
    companies: makeCompanyRepository(supabase),
    sessions: makeSessionRepository(supabase),
    access: makeStoreAccessReader(supabase),
    clock,
  };
  return {
    listHistory: makeListHistory(deps),
    listAuthEvents: makeListAuthEvents(deps),
    countHistory: makeCountHistory(deps),
    countAuthEvents: makeCountAuthEvents(deps),
  };
}
