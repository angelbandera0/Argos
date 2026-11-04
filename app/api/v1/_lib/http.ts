import type { z } from "zod";
import { NotFound, RuleViolation } from "@/core/domain/errors";
import { getContainer } from "@/infrastructure/container";

export const bearer = (req: Request) => /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1] ?? "";
export const svc = (req: Request) => getContainer().api(bearer(req));

export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.output<T>> {
  const parsed = schema.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) throw new RuleViolation("INVALID_INPUT");
  return parsed.data;
}

export const params = async <T>(ctx: unknown): Promise<T> => (ctx as { params: Promise<T> }).params;

/** `abc:deactivate` -> { id: "abc", action: "deactivate" }. */
export function parseRef(ref: string): { id: string; action?: string } {
  const [id, action] = decodeURIComponent(ref).split(":");
  return { id, action };
}

export const created = (data: unknown) => Response.json(data, { status: 201 });
export const noContent = () => new Response(null, { status: 204 });
export const secret = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export const query = (req: Request) => new URL(req.url).searchParams;

/** Cursor pagination over an in-memory list; the cursor is the offset of the next item. */
export function paginate<T>(items: T[], req: Request): { items: T[]; nextCursor: string | null } {
  const q = query(req);
  const offset = Math.max(0, Number.parseInt(q.get("cursor") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, Number.parseInt(q.get("limit") ?? "50", 10) || 50));
  const page = items.slice(offset, offset + limit);
  return { items: page, nextCursor: offset + limit < items.length ? String(offset + limit) : null };
}

export function unknownAction(): never {
  throw new NotFound();
}

const date = (v: string | null) => {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new RuleViolation("INVALID_INPUT");
  return d;
};
const list = (v: string | null) => (v ? v.split(",") : undefined);

/** Shared history filters and cursor from the query string. */
export function historyQuery(req: Request) {
  const q = query(req);
  const limit = q.get("limit");
  return {
    companyId: q.get("companyId") ?? undefined,
    channel: q.get("channel") ?? undefined,
    from: date(q.get("from")),
    to: date(q.get("to")),
    cursor: q.get("cursor") ?? undefined,
    limit: limit ? Number.parseInt(limit, 10) : undefined,
    list,
    q,
  };
}
