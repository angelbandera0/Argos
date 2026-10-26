"use server";

import { z } from "zod";
import { normalizeName, validateName } from "@/core/domain/name";
import { getContainer } from "@/infrastructure/container";
import { requireSuperadmin } from "../guard";

export interface NewAdminState {
  error?: string;
  email?: string;
  displayName?: string;
  temporaryPassword?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function createAdminAction(_: NewAdminState, formData: FormData): Promise<NewAdminState> {
  const { actor } = await requireSuperadmin();
  const email = text(formData, "email").trim().toLowerCase();
  const displayName = normalizeName(text(formData, "displayName"));
  const echo = { email, displayName };
  if (!z.email().safeParse(email).success) return { ...echo, error: "Escribe un correo válido." };
  try {
    validateName(displayName);
  } catch {
    return { ...echo, error: "Escribe un nombre de hasta 80 caracteres." };
  }
  try {
    const { temporaryPassword } = await getContainer().createAdmin(actor, { email, displayName });
    return { ...echo, temporaryPassword };
  } catch (e) {
    const exists = e instanceof Error && e.message.includes("email_exists");
    return {
      ...echo,
      error: exists
        ? "Ya existe un usuario con ese correo."
        : "No se pudo crear el administrador. Inténtalo de nuevo.",
    };
  }
}
