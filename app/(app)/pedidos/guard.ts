import "server-only";
import { makeOrders } from "@/infrastructure/supabase/order-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { requireStockUser } from "../existencias/guard";

export async function requireOrderUser() {
  const user = await requireStockUser();
  const supabase = await createServerClient();
  return { ...user, supabase, orders: makeOrders(supabase), canBuild: user.can("build_orders") };
}
