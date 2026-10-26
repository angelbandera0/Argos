"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Level } from "@/core/application/ports/company-repository";
import { REASON_CODES, type ReasonCode } from "@/core/domain/deactivation";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { normalizeName, validateName } from "@/core/domain/name";
import { ACTIVE_COMPANY_COOKIE, requireOrgUser } from "./guard";

export interface ActionState {
  error?: string;
  name?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

function fail(e: unknown, taken: string): string {
  if (e instanceof Forbidden) return "No tienes permiso para hacer esto.";
  if (e instanceof NotFound) return "No encontramos lo que buscas. Recarga la página.";
  if (e instanceof RuleViolation) {
    if (e.code === "NAME_TAKEN") return taken;
    if (e.code === "REASON_REQUIRED") return "Escribe el motivo para continuar.";
  }
  return "No se pudo completar la acción. Inténtalo de nuevo.";
}

function cleanName(raw: string): { name: string } | { error: string } {
  const name = normalizeName(raw);
  try {
    validateName(name);
  } catch {
    return { error: "Escribe un nombre de hasta 80 caracteres." };
  }
  return { name };
}

export async function createCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { actor, org } = await requireOrgUser();
  const n = cleanName(text(formData, "name"));
  if ("error" in n) return { name: text(formData, "name"), error: n.error };
  let id: string;
  try {
    id = (await org.createCompany(actor, { name: n.name })).id;
  } catch (e) {
    return { name: n.name, error: fail(e, "Ya tienes una compañía con ese nombre.") };
  }
  revalidatePath("/companias", "layout");
  redirect(`/companias/${id}`);
}

export async function createSiteAction(companyId: string, formData: FormData): Promise<ActionState> {
  const { actor, org } = await requireOrgUser();
  const n = cleanName(text(formData, "name"));
  if ("error" in n) return n;
  try {
    await org.createSite(actor, { companyId, name: n.name });
  } catch (e) {
    return { error: fail(e, "Ya hay una sede con ese nombre en esta compañía.") };
  }
  revalidatePath("/companias", "layout");
  return {};
}

export async function createStoreAction(
  companyId: string,
  siteId: string,
  formData: FormData,
): Promise<ActionState> {
  const { actor, org } = await requireOrgUser();
  const n = cleanName(text(formData, "name"));
  if ("error" in n) return n;
  try {
    await org.createStore(actor, { companyId, siteId, name: n.name });
  } catch (e) {
    return { error: fail(e, "Ya hay una tienda con ese nombre en esta sede.") };
  }
  revalidatePath("/companias", "layout");
  return {};
}

const LEVELS: Level[] = ["company", "site", "store"];

export async function deactivateUnitAction(
  level: Level,
  id: string,
  code: ReasonCode,
  reasonText: string,
): Promise<ActionState> {
  const { actor, org } = await requireOrgUser();
  if (!LEVELS.includes(level) || !REASON_CODES.includes(code)) return { error: "Elige un motivo." };
  try {
    await org.deactivateUnit(actor, { level, id, reason: { code, text: reasonText.trim() || undefined } });
  } catch (e) {
    return { error: fail(e, "") };
  }
  revalidatePath("/companias", "layout");
  return {};
}

export async function reactivateUnitAction(level: Level, id: string, reasonText: string): Promise<ActionState> {
  const { actor, org } = await requireOrgUser();
  if (!LEVELS.includes(level)) return { error: "No se pudo completar la acción." };
  try {
    await org.reactivateUnit(actor, { level, id, text: reasonText });
  } catch (e) {
    return { error: fail(e, "") };
  }
  revalidatePath("/companias", "layout");
  return {};
}

export async function setActiveCompanyAction(companyId: string): Promise<void> {
  const { actor, org } = await requireOrgUser();
  if (!(await org.listCompanies(actor)).some((c) => c.id === companyId)) return;
  (await cookies()).set(ACTIVE_COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/", "layout");
}
