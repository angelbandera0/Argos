import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeAdjustOrder, makeAssignBuyer, makeConfirmOrder, makeCreateOrder, makeRegisterPurchase, makeReturnOrder, makeSaveReview, makeSubmitReview } from "@/core/application/use-cases/orders/commands";
import { makeGetOrder, makeListOrders } from "@/core/application/use-cases/orders/queries";
import { makeCompanyRepository } from "./company-repository";
import { makeOrderRepository } from "./order-repository";
import { makeSessionRepository } from "./session-repository";
import { makeStoreAccessReader } from "./store-access-reader";

/** Purchase order use cases bound to one request's user client (RLS applies). */
export function makeOrders(supabase: SupabaseClient) {
  const deps = {
    orders: makeOrderRepository(supabase),
    companies: makeCompanyRepository(supabase),
    sessions: makeSessionRepository(supabase),
    access: makeStoreAccessReader(supabase),
    clock: { now: () => new Date() },
  };
  return {
    createOrder: makeCreateOrder(deps),
    assignBuyer: makeAssignBuyer(deps),
    registerPurchase: makeRegisterPurchase(deps),
    submitReview: makeSubmitReview(deps),
    saveReview: makeSaveReview(deps),
    confirmOrder: makeConfirmOrder(deps),
    returnOrder: makeReturnOrder(deps),
    adjustOrder: makeAdjustOrder(deps),
    listOrders: makeListOrders(deps),
    getOrder: makeGetOrder(deps),
  };
}
