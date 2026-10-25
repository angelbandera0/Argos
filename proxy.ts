import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { ActorKind } from "@/core/domain/actor";
import {
  decideRedirect,
  type RedirectSession,
} from "@/infrastructure/proxy/decide-redirect";

const KINDS: readonly string[] = ["superadmin", "admin", "operator"];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Without Supabase env (e.g. `next dev` before .env.local) pass through untouched.
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });

  // Must run before any response is built so refreshed cookies are written.
  let claims: Record<string, unknown> | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    claims = (data?.claims as Record<string, unknown> | undefined) ?? null;
  } catch {
    claims = null;
  }

  const redirectTo = decideRedirect({
    pathname: request.nextUrl.pathname,
    session: toSession(claims),
  });
  if (!redirectTo) return response;

  const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  for (const h of ["cache-control", "expires", "pragma"]) {
    const v = response.headers.get(h);
    if (v) redirect.headers.set(h, v);
  }
  return redirect;
}

function toSession(claims: Record<string, unknown> | null): RedirectSession | null {
  if (!claims) return null;
  const meta = (claims.app_metadata ?? {}) as Record<string, unknown>;
  const kind = claims.user_kind ?? meta.user_kind;
  if (typeof kind !== "string" || !KINDS.includes(kind)) return null;
  return {
    kind: kind as ActorKind,
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
    mustChangePassword: meta.must_change_password === true,
    sessionEnded: false, // app_sessions lookup arrives in a later task
  };
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
