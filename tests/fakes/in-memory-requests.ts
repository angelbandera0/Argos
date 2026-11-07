import type {
  AttendLineCommand,
  BagRow,
  CreateRequestCommand,
  RequestDetail,
  RequestFilters,
  RequestRepository,
  RequestSummary,
} from "@/core/application/ports/request-repository";
import { lineStatus, requestStatus } from "@/core/domain/requests";

export class InMemoryRequests implements RequestRepository {
  requests: RequestDetail[] = [];
  bag: BagRow[] = [];
  attended: AttendLineCommand[] = [];

  constructor(readonly companyOfStore: Record<string, string> = {}) {}

  async create(cmd: CreateRequestCommand) {
    const id = `req-${this.requests.length + 1}`;
    this.requests.push({
      id,
      companyId: this.companyOfStore[cmd.storeId] ?? "c1",
      storeId: cmd.storeId,
      storeName: cmd.storeId,
      status: "new",
      lineCount: cmd.lines.length,
      createdAt: "2026-01-01",
      note: cmd.note ?? null,
      lines: cmd.lines.map((l, i) => ({
        id: `${id}-l${i + 1}`,
        productId: l.productId,
        productName: l.productId,
        qty: l.qty,
        unit: l.unit,
        qtyBase: l.qty,
        assignments: [],
      })),
    });
    return id;
  }

  async attendLine(cmd: AttendLineCommand) {
    this.attended.push(cmd);
    return `asg-${this.attended.length}`;
  }

  private withStatus(r: RequestDetail): RequestDetail {
    return { ...r, status: requestStatus(r.lines.map((l) => lineStatus(l.qtyBase, l.assignments))) };
  }

  async list(companyId: string, filters: RequestFilters, page: { offset: number; limit: number }) {
    const all = this.requests
      .filter((r) => r.companyId === companyId && (!filters.storeId || r.storeId === filters.storeId))
      .map((r) => this.withStatus(r))
      .filter((r) => !filters.status || r.status === filters.status);
    const items: RequestSummary[] = all.slice(page.offset, page.offset + page.limit);
    return { items, total: all.length };
  }

  async get(requestId: string) {
    const r = this.requests.find((x) => x.id === requestId);
    return r ? this.withStatus(r) : null;
  }

  async getByLine(lineId: string) {
    const r = this.requests.find((x) => x.lines.some((l) => l.id === lineId));
    return r ? this.withStatus(r) : null;
  }

  async listPurchaseBag(companyId: string) {
    return this.bag.filter((b) => (this.companyOfStore[b.storeId] ?? "c1") === companyId);
  }
}
