"use server";

import { revalidatePath } from "next/cache";
import { purchaseErrorMessage, purchaseSchema } from "@/components/orders/purchase-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireOrderUser } from "../guard";

export interface PurchaseActionState {
  error?: string;
  ok?: "saved" | "submitted";
}

export async function purchaseAction(input: unknown, submit: boolean): Promise<PurchaseActionState> {
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return { error: purchaseErrorMessage("INVALID_QUANTITY") };
  const { actor, orders, companyId } = await requireOrderUser();
  try {
    await orders.registerPurchase(actor, { companyId, orderId: parsed.data.orderId, lines: parsed.data.lines });
    if (submit) await orders.submitReview(actor, { companyId, orderId: parsed.data.orderId });
  } catch (e) {
    if (e instanceof Forbidden) return { error: "Solo el comprador asignado puede registrar la compra." };
    if (e instanceof NotFound) return { error: "El pedido ya no existe." };
    return { error: purchaseErrorMessage(e instanceof RuleViolation ? e.code : undefined) };
  }
  revalidatePath(`/pedidos/${parsed.data.orderId}`);
  revalidatePath("/pedidos");
  return { ok: submit ? "submitted" : "saved" };
}
