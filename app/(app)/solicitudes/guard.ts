import "server-only";
import { makeRequests } from "@/infrastructure/supabase/request-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { requireStockUser } from "../existencias/guard";

export async function requireRequestUser() {
  const user = await requireStockUser();
  const requests = makeRequests(await createServerClient());
  return { ...user, requests, canRequest: user.can("request_replenishment"), canHandle: user.can("handle_requests") };
}
