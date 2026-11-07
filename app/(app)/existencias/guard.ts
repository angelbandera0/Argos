import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { type SpecialPermission, hasSpecial } from "@/core/domain/permissions";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCurrencies } from "@/infrastructure/supabase/currencies-factory";
import { makeOrg } from "@/infrastructure/supabase/org-factory";
import { makeSessionRepository } from "@/infrastructure/supabase/session-repository";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeStock } from "@/infrastructure/supabase/stock-factory";
import { makeStoreAccessReader } from "@/infrastructure/supabase/store-access-reader";
import { ACTIVE_COMPANY_COOKIE } from "../companias/guard";

/** Admins work on the active company (cookie), operators on their active store; the use cases decide what is visible. */
export async function requireStockUser() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "superadmin" || claims.mustChangePassword) notFound();
  const stock = makeStock(supabase);
  const currencies = makeCurrencies(supabase);
  if (claims.kind === "admin") {
    if (claims.aal !== "aal2") notFound();
    const actor: Actor = { userId: claims.userId, kind: "admin", channel: "ui" };
    const companies = await makeOrg(supabase).listCompanies(actor);
    const id = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
    const companyId = companies.find((c) => c.id === id)?.id;
    return { actor, stock, currencies, companyId, storeId: undefined, can: (_: SpecialPermission) => true, canWh: (_: SpecialPermission) => true, costs: true };
  }
  if (!claims.sessionId) redirect("/tienda");
  const actor: Actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId };
  try {
    const { store } = await requireOperatorStore(
      { sessions: makeSessionRepository(supabase), access: makeStoreAccessReader(supabase), clock: { now: () => new Date() } },
      actor,
    );
    const can = (p: SpecialPermission) => hasSpecial(store, p);
    return { actor, stock, currencies, companyId: store.companyId, storeId: store.storeId, can, canWh: (p: SpecialPermission) => hasSpecial(store, p, { warehouse: true }), costs: can("see_costs") };
  } catch (e) {
    if (e instanceof Forbidden || e instanceof SessionExpired || e instanceof RuleViolation) redirect("/tienda");
    throw e;
  }
}
