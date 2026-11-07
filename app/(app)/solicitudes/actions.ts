"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseLines, requestErrorMessage, requestSchema } from "@/components/requests/request-logic";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import { requireRequestUser } from "./guard";

export interface RequestActionState {
  error?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function createRequestAction(_: RequestActionState, f: FormData): Promise<RequestActionState> {
  const { actor, requests, companyId, storeId } = await requireRequestUser();
  const p = requestSchema.safeParse({ storeId: text(f, "storeId"), note: text(f, "note"), lines: parseLines(text(f, "lines")) });
  if (!p.success) return { error: requestErrorMessage("INVALID_INPUT") };
  const target = storeId ?? p.data.storeId;
  if (!target) return { error: requestErrorMessage("INVALID_INPUT") };
  let id: string;
  try {
    id = await requests.createRequest(actor, { companyId, storeId: target, note: p.data.note || undefined, lines: p.data.lines });
  } catch (e) {
    if (e instanceof Forbidden) return { error: "No tienes permiso para solicitar reposición." };
    return { error: requestErrorMessage(e instanceof RuleViolation ? e.code : undefined) };
  }
  revalidatePath("/solicitudes");
  redirect(`/solicitudes/${id}?enviada=1`);
}
