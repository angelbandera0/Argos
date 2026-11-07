import { describe, expect, it, vi } from "vitest";
import { withActor } from "@/app/api/v1/_lib/with-actor";
import { buildOpenApiDocument } from "@/app/api/v1/_lib/openapi";
import { Forbidden } from "@/core/domain/errors";

const actor = { userId: "u1", kind: "admin" as const, channel: "api" as const };
const call = (h: ReturnType<typeof withActor>, auth?: string) =>
  h(new Request("http://x/api/v1/a", { headers: auth ? { authorization: auth } : {} }), {});

describe("withActor", () => {
  it("401 without Authorization", async () => {
    const handler = vi.fn();
    expect((await call(withActor(handler, async () => actor))).status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("401 with an invalid token", async () => {
    expect((await call(withActor(vi.fn(), async () => null), "Bearer bad")).status).toBe(401);
    expect((await call(withActor(vi.fn(), async () => { throw new Error("x"); }), "Bearer bad")).status).toBe(401);
  });

  it("passes the resolved actor and maps thrown errors", async () => {
    const ok = withActor(async (_r, a) => Response.json(a), async (t) => (t === "good" ? actor : null));
    const res = await call(ok, "Bearer good");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(actor);

    const bad = withActor(async () => { throw new Forbidden(); }, async () => actor);
    expect((await call(bad, "Bearer good")).status).toBe(403);
  });
});

describe("buildOpenApiDocument", () => {
  it("is OpenAPI 3.1 with the companies path", () => {
    const doc = buildOpenApiDocument() as { openapi: string; paths: Record<string, unknown> };
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.paths).toHaveProperty("/api/v1/companies");
  });
});
