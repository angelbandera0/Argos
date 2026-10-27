import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccessNotice } from "@/components/auth/access-notice";
import { ChevronRight, Store } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { effectiveExpiry, formatSessionEnd } from "@/core/domain/session";
import { readClaims } from "@/infrastructure/supabase/claims";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeUsers } from "@/infrastructure/supabase/users-factory";
import { chooseStore, logout } from "../entrar/actions";
import Loading from "./loading";

// The session read cannot be prerendered: opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Elige tu tienda · Argos" };

async function Stores({ errored }: { errored: boolean }) {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind !== "operator" || !claims.sessionId) redirect("/entrar");
  const users = makeUsers(supabase);
  const session = await users.sessions.get(claims.sessionId);
  if (!session || session.endedAt) {
    return (
      <AccessNotice
        title="Sesión terminada"
        text="Tu sesión terminó. Vuelve a entrar con tu PIN."
        action={logout}
        actionLabel="Volver a entrar"
        forgotPin
      />
    );
  }
  const [profile, stores] = await Promise.all([
    users.users.getProfile(claims.userId),
    users.access.listStoreAccess(claims.userId),
  ]);
  if (!stores.some((s) => s.operational)) {
    return (
      <AccessNotice
        title="Sin tiendas disponibles"
        text="No tienes ninguna tienda disponible ahora. Pide ayuda a quien administra tu compañía."
        action={logout}
        actionLabel="Cerrar sesión"
      />
    );
  }
  const sites = Map.groupBy(stores, (s) => s.siteName);
  return (
    <Card>
      <div className="auth-title">
        <h1>Elige tu tienda</h1>
        <p>{profile?.displayName ?? "Operador"}</p>
      </div>
      {errored && (
        <Alert variant="danger">No se pudo entrar a esa tienda. Elige otra o inténtalo de nuevo.</Alert>
      )}
      {[...sites].map(([site, list]) => (
        <section key={site} className="store-site">
          <span className="eyebrow">{site}</span>
          {list.map((s) => (
            <form key={s.storeId} action={chooseStore}>
              <input type="hidden" name="storeId" value={s.storeId} />
              <button type="submit" className="store-row" disabled={!s.operational}>
                <Store aria-hidden="true" />
                <span className="store-info">
                  <strong>{s.storeName}</strong>
                  <span className="caption">
                    {s.operational
                      ? `${s.roleName} · Sesión hasta las ${formatSessionEnd(
                          effectiveExpiry({
                            startedAt: session.startedAt,
                            companyCapSeconds: s.companyCapSeconds,
                            roleSeconds: s.roleSessionSeconds,
                          }),
                        )}`
                      : "No disponible: tienda desactivada"}
                  </span>
                </span>
                {s.operational && <ChevronRight aria-hidden="true" />}
              </button>
            </form>
          ))}
        </section>
      ))}
      <form action={logout}>
        <Button type="submit" variant="ghost">
          Cerrar sesión
        </Button>
      </form>
    </Card>
  );
}

export default function StorePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <StoresWithParams searchParams={searchParams} />
    </Suspense>
  );
}

async function StoresWithParams({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return <Stores errored={Boolean((await searchParams).error)} />;
}
