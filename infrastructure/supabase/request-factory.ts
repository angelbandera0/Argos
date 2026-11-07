import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeAttendRequestLine } from "@/core/application/use-cases/requests/attend-request-line";
import { makeCreateRequest } from "@/core/application/use-cases/requests/create-request";
import { makeGetRequest, makeListPurchaseBag, makeListRequests } from "@/core/application/use-cases/requests/queries";
import { makeCompanyRepository } from "./company-repository";
import { makeRequestRepository } from "./request-repository";
import { makeSessionRepository } from "./session-repository";
import { makeStoreAccessReader } from "./store-access-reader";

/** Replenishment request use cases bound to one request's user client (RLS applies). */
export function makeRequests(supabase: SupabaseClient) {
  const deps = {
    requests: makeRequestRepository(supabase),
    companies: makeCompanyRepository(supabase),
    sessions: makeSessionRepository(supabase),
    access: makeStoreAccessReader(supabase),
    clock: { now: () => new Date() },
  };
  return {
    createRequest: makeCreateRequest(deps),
    attendRequestLine: makeAttendRequestLine(deps),
    listRequests: makeListRequests(deps),
    getRequest: makeGetRequest(deps),
    listPurchaseBag: makeListPurchaseBag(deps),
  };
}
