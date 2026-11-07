import type { RequestStatus } from "@/core/domain/requests";
import { body, created, query, svc } from "../_lib/http";
import { schemas } from "../_lib/schemas";
import { withActor } from "../_lib/with-actor";

const num = (v: string | null) => (v === null ? undefined : Number(v));

export const GET = withActor(async (req, actor) => {
  const q = query(req);
  const out = await svc(req).requests.listRequests(actor, {
    companyId: q.get("companyId") ?? undefined,
    storeId: q.get("storeId") ?? undefined,
    status: (q.get("status") as RequestStatus | null) ?? undefined,
    page: num(q.get("page")),
    pageSize: num(q.get("pageSize")),
  });
  return Response.json(out);
});

export const POST = withActor(async (req, actor) => {
  return created({ id: await svc(req).requests.createRequest(actor, await body(req, schemas.createRequest)) });
});
