import type { ActorKind } from "@/core/domain/actor";

export interface RedirectSession {
  kind: ActorKind;
  aal: "aal1" | "aal2";
  mustChangePassword: boolean;
  sessionEnded: boolean;
}

const PUBLIC_PATHS = ["/login", "/entrar", "/recuperar"];
const OPERATOR_PATHS = ["/", "/tienda", "/catalogo/productos", "/historial"];
const ADMIN_AUTH_PAGES = ["/login", "/login/2fa", "/entrar", "/primer-ingreso", "/recuperar"];

/** True when pathname equals prefix or lies under it, comparing whole segments. */
function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const matchesAny = (pathname: string, prefixes: string[]) =>
  prefixes.some((p) => matches(pathname, p));

export function decideRedirect(i: {
  pathname: string;
  session: RedirectSession | null;
}): string | null {
  const { pathname, session } = i;

  if (!session) {
    // /login/2fa needs an aal1 session, so it is not public without one.
    if (matches(pathname, "/login/2fa")) return "/login";
    if (matchesAny(pathname, PUBLIC_PATHS)) return null;
    if (matches(pathname, "/entrar") || matches(pathname, "/tienda")) return "/entrar";
    return "/login";
  }

  if (session.mustChangePassword) {
    return matches(pathname, "/primer-ingreso") ? null : "/primer-ingreso";
  }

  const isAdmin = session.kind === "admin" || session.kind === "superadmin";

  if (isAdmin && session.aal === "aal1") {
    return matches(pathname, "/login/2fa") || matches(pathname, "/primer-ingreso")
      ? null
      : "/login/2fa";
  }

  if (!isAdmin) {
    if (session.sessionEnded) {
      return matchesAny(pathname, PUBLIC_PATHS) ? null : "/entrar";
    }
    return matchesAny(pathname, OPERATOR_PATHS) ? null : "/tienda";
  }

  if (matches(pathname, "/superadmin") && session.kind !== "superadmin") return "/";

  return matchesAny(pathname, ADMIN_AUTH_PAGES) ? "/" : null;
}
