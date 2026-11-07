import type { Comparison, OrderDest, OrderStatus, StorePart } from "@/core/domain/orders";

/** Cost fields: undefined = hidden (no permission), null = no known cost. */
export interface OrderLine {
  id: string;
  productId: string;
  productName: string;
  dest: OrderDest;
  destStoreId: string | null;
  qty: number;
  unit: string;
  content: number;
  qtyBought: number | null;
  qtyReceived: number | null;
  plan: StorePart[];
  unitCost?: number | null;
  shortageValue?: number | null;
}

export interface OrderSummary {
  id: string;
  companyId: string;
  status: OrderStatus;
  buyerId: string | null;
  lineCount: number;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  currencyId: string | null;
  note: string | null;
  returnNote: string | null;
  lines: OrderLine[];
  amountGiven?: number | null;
  spent?: number | null;
  leftover?: number | null;
  shortageValue?: number | null;
}

export interface CreateOrderCommand {
  currencyId?: string;
  note?: string;
  lines: { productId: string; dest: OrderDest; storeId?: string; qty: number; unit: string; content: number; assignmentId?: string; plan?: StorePart[] }[];
}

export interface PurchaseCommand {
  orderId: string;
  lines: { lineId: string; qtyBought: number; unitCost: number }[];
  amountGiven?: number;
}

export interface ReviewLine {
  lineId: string;
  qtyReceived?: number;
  reparto?: StorePart[];
}

export interface OrderFilters {
  status?: OrderStatus;
  buyerId?: string;
  /** Inclusive lower / exclusive upper bound on createdAt (ISO). */
  createdFrom?: string;
  createdTo?: string;
}

/** Reads rely on RLS; writes go through the create_pedido ... adjust_pedido RPCs. */
export interface OrderRepository {
  create(cmd: CreateOrderCommand): Promise<string>;
  assignBuyer(orderId: string, buyerId: string): Promise<void>;
  isEligibleBuyer(companyId: string, userId: string): Promise<boolean>;
  registerPurchase(cmd: PurchaseCommand): Promise<void>;
  submitReview(orderId: string): Promise<Comparison>;
  saveReview(orderId: string, lines: { lineId: string; qtyReceived: number }[]): Promise<void>;
  confirm(orderId: string, lines: ReviewLine[]): Promise<void>;
  returnOrder(orderId: string, note: string): Promise<void>;
  adjust(orderId: string, reason: string, lines: { lotId: string; delta: number }[]): Promise<string>;
  list(companyId: string, filters: OrderFilters, page: { offset: number; limit: number }): Promise<{ items: OrderSummary[]; total: number }>;
  get(orderId: string): Promise<OrderDetail | null>;
}
