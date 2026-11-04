import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Actor } from "@/core/domain/actor";
import { getEnv } from "@/infrastructure/env";
import { parseClaims } from "@/infrastructure/supabase/claims";
import { problem, toProblem } from "./problem";

export type ResolveActor = (token: string) => Promise<Actor | null>;

export const resolveActorFromToken: ResolveActor = async (token) => {
  const env = getEnv();
  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await client.auth.getClaims(token);
  const claims = parseClaims(data?.claims as Record<string, unknown> | undefined);
  if (!claims || claims.mustChangePassword) return null;
  if (claims.kind !== "operator" && claims.aal !== "aal2") return null;
  return {
    userId: claims.userId,
    kind: claims.kind,
    channel: "api",
    ...(claims.sessionId && { sessionId: claims.sessionId }),
  };
};

export function withActor(
  handler: (req: Request, actor: Actor, ctx: unknown) => Promise<Response>,
  resolve: ResolveActor = resolveActorFromToken,
): (req: Request, ctx: unknown) => Promise<Response> {
  return async (req, ctx) => {
    try {
      const match = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "");
      const actor = match ? await resolve(match[1]).catch(() => null) : null;
      if (!actor) return problem(401, "Unauthorized");
      return await handler(req, actor, ctx);
    } catch (e) {
      return toProblem(e);
    }
  };
}
