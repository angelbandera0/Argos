"use server";

import { revalidatePath } from "next/cache";
import { configErrorMessage, minimumSchema, movementUnitSchema, presentationSchema } from "@/components/stock/product-config-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireStockUser } from "../guard";

export interface ConfigActionState {
  error?: string;
  nameError?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");
const INVALID: ConfigActionState = { error: configErrorMessage("INVALID_INPUT") };

function fail(e: unknown): ConfigActionState {
  if (e instanceof RuleViolation && e.code === "NAME_TAKEN") return { nameError: configErrorMessage(e.code) };
  if (e instanceof RuleViolation) return { error: configErrorMessage(e.code) };
  if (e instanceof Forbidden) return { error: "No tienes permiso para hacer esto." };
  if (e instanceof NotFound) return { error: "No encontramos el elemento. Recarga la página." };
  return { error: configErrorMessage() };
}

async function run(productId: string, fn: (u: Awaited<ReturnType<typeof requireStockUser>>) => Promise<unknown>): Promise<ConfigActionState> {
  const user = await requireStockUser();
  try {
    await fn(user);
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/existencias/${productId}`);
  return {};
}

export async function savePresentationAction(productId: string, id: string | null, _prev: ConfigActionState, f: FormData): Promise<ConfigActionState> {
  const p = presentationSchema.safeParse({ name: text(f, "name"), content: text(f, "content") });
  if (!p.success) return INVALID;
  return run(productId, ({ actor, stock }) => (id ? stock.updatePresentation(actor, { productId, id, ...p.data }) : stock.addPresentation(actor, { productId, ...p.data })));
}

export async function saveMovementUnitAction(productId: string, id: string | null, _prev: ConfigActionState, f: FormData): Promise<ConfigActionState> {
  const p = movementUnitSchema.safeParse({ name: text(f, "name"), equivalence: text(f, "equivalence") });
  if (!p.success) return INVALID;
  return run(productId, ({ actor, stock }) => (id ? stock.updateMovementUnit(actor, { productId, id, ...p.data }) : stock.addMovementUnit(actor, { productId, ...p.data })));
}

export async function setItemActiveAction(productId: string, kind: "presentation" | "unit", id: string, active: boolean) {
  return run(productId, ({ actor, stock }) =>
    kind === "presentation" ? stock.setPresentationActive(actor, { productId, id, active }) : stock.setMovementUnitActive(actor, { productId, id, active }),
  );
}

export async function deleteItemAction(productId: string, kind: "presentation" | "unit", id: string) {
  return run(productId, ({ actor, stock }) => (kind === "presentation" ? stock.deletePresentation(actor, { productId, id }) : stock.deleteMovementUnit(actor, { productId, id })));
}

export async function saveMinimumAction(productId: string, locationId: string, _prev: ConfigActionState, f: FormData): Promise<ConfigActionState> {
  const p = minimumSchema.safeParse({ minimum: text(f, "minimum") });
  if (!p.success) return INVALID;
  return run(productId, ({ actor, stock }) =>
    p.data.minimum === 0 ? stock.clearMinimum(actor, { productId, locationId }) : stock.setMinimum(actor, { productId, locationId, minimum: p.data.minimum }),
  );
}

export async function changeBaseUnitAction(productId: string, storable: boolean, baseUnit: string) {
  return run(productId, ({ actor, stock }) => stock.saveProductStockConfig(actor, { productId, storable, baseUnit }));
}
