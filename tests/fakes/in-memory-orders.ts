import type {
  CreateOrderCommand,
  OrderDetail,
  OrderFilters,
  OrderRepository,
  PurchaseCommand,
  ReviewLine,
} from "@/core/application/ports/order-repository";
import { comparison, shortageValue } from "@/core/domain/orders";

export class InMemoryOrders implements OrderRepository {
  orders: OrderDetail[] = [];
  eligible = new Set<string>();
  confirmed: { orderId: string; lines: ReviewLine[] }[] = [];
  adjusted: { orderId: string; reason: string; lines: { lotId: string; delta: number }[] }[] = [];
  /** Stock that entered on confirm: lineId -> quantity. */
  entered: Record<string, number> = {};

  constructor(readonly company = "c1") {}

  private find(id: string) {
    return this.orders.find((o) => o.id === id)!;
  }

  async create(cmd: CreateOrderCommand) {
    const id = `ord-${this.orders.length + 1}`;
    this.orders.push({
      id,
      companyId: this.company,
      status: "open",
      buyerId: null,
      lineCount: cmd.lines.length,
      createdAt: "2026-01-01",
      currencyId: cmd.currencyId ?? null,
      note: cmd.note ?? null,
      returnNote: null,
      amountGiven: null,
      spent: null,
      leftover: null,
      shortageValue: null,
      lines: cmd.lines.map((l, i) => ({
        id: `${id}-l${i + 1}`,
        productId: l.productId,
        productName: l.productId,
        dest: l.dest,
        destStoreId: l.storeId ?? null,
        qty: l.qty,
        unit: l.unit,
        content: l.content,
        qtyBought: null,
        qtyReceived: null,
        plan: l.plan ?? [],
        unitCost: null,
        shortageValue: null,
      })),
    });
    return id;
  }

  async assignBuyer(orderId: string, buyerId: string) {
    this.find(orderId).buyerId = buyerId;
  }

  async isEligibleBuyer(_company: string, userId: string) {
    return this.eligible.has(userId);
  }

  async registerPurchase(cmd: PurchaseCommand) {
    const o = this.find(cmd.orderId);
    for (const l of cmd.lines) {
      const line = o.lines.find((x) => x.id === l.lineId)!;
      line.qtyBought = l.qtyBought;
      line.unitCost = l.unitCost;
    }
    if (cmd.amountGiven !== undefined) o.amountGiven = cmd.amountGiven;
  }

  async submitReview(orderId: string) {
    const o = this.find(orderId);
    const c = comparison(o.amountGiven ?? null, o.lines.map((l) => ({ qtyBought: l.qtyBought ?? 0, unitCost: l.unitCost ?? 0 })));
    Object.assign(o, { status: "in_review", spent: c.spent, leftover: c.leftover, returnNote: null });
    return c;
  }

  async saveReview(orderId: string, lines: { lineId: string; qtyReceived: number }[]) {
    const o = this.find(orderId);
    for (const l of lines) o.lines.find((x) => x.id === l.lineId)!.qtyReceived = l.qtyReceived;
  }

  async confirm(orderId: string, lines: ReviewLine[]) {
    const o = this.find(orderId);
    this.confirmed.push({ orderId, lines });
    let short: number | null = 0;
    for (const l of o.lines) {
      const received = lines.find((x) => x.lineId === l.id)?.qtyReceived ?? l.qtyReceived ?? l.qtyBought ?? 0;
      l.qtyReceived = received;
      this.entered[l.id] = received;
      l.shortageValue = shortageValue(l.qtyBought ?? 0, received, l.unitCost ?? null);
      short = short === null || l.shortageValue === null ? null : short + l.shortageValue;
    }
    Object.assign(o, { status: "fulfilled", shortageValue: short });
  }

  async returnOrder(orderId: string, note: string) {
    Object.assign(this.find(orderId), { status: "returned", returnNote: note });
  }

  async adjust(orderId: string, reason: string, lines: { lotId: string; delta: number }[]) {
    this.adjusted.push({ orderId, reason, lines });
    return `adj-${this.adjusted.length}`;
  }

  async list(companyId: string, filters: OrderFilters, page: { offset: number; limit: number }) {
    const all = this.orders.filter(
      (o) => o.companyId === companyId && (!filters.status || o.status === filters.status) && (!filters.buyerId || o.buyerId === filters.buyerId),
    );
    return { items: all.slice(page.offset, page.offset + page.limit), total: all.length };
  }

  async get(orderId: string) {
    const o = this.orders.find((x) => x.id === orderId);
    return o ? structuredClone(o) : null;
  }
}
