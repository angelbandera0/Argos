"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { commandLine, orderErrorMessage, payloadSchema } from "@/components/orders/order-logic";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import { requireOrderUser } from "./guard";

export interface OrderActionState {
  error?: string;
}

export async function createOrderAction(_: OrderActionState, f: FormData): Promise<OrderActionState> {
  const { actor, orders, stock, companyId } = await requireOrderUser();
  const raw = f.get("payload");
  let parsed;
  try {
    parsed = payloadSchema.safeParse(JSON.parse(typeof raw === "string" ? raw : ""));
  } catch {
    return { error: orderErrorMessage("INVALID_INPUT") };
  }
  if (!parsed.success) return { error: orderErrorMessage("EMPTY_ORDER") };
  let id: string;
  try {
    const lines = await Promise.all(
      parsed.data.lines.map(async (l) => commandLine(l, (await stock.getProductStockConfig(actor, { productId: l.productId })).baseUnit)),
    );
    id = await orders.createOrder(actor, { companyId, lines });
    if (parsed.data.buyerId) await orders.assignBuyer(actor, { companyId, orderId: id, buyerId: parsed.data.buyerId });
  } catch (e) {
    if (e instanceof Forbidden) return { error: "No tienes permiso para armar pedidos." };
    return { error: orderErrorMessage(e instanceof RuleViolation ? e.code : undefined) };
  }
  revalidatePath("/pedidos");
  redirect("/pedidos");
}
