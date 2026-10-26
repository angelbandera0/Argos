import type { AuthEventEntry, HistoryEntry, HistoryReader } from "@/core/application/ports/history-reader";

type ListInput = Parameters<HistoryReader["list"]>[0];

/** Cursor is the offset into the newest-first list. */
export class InMemoryHistory implements HistoryReader {
  readonly entries: Array<HistoryEntry & { companyId: string }> = [];
  readonly authEvents: Array<AuthEventEntry & { companyId: string }> = [];
  lastList: ListInput | null = null;

  private page<T extends { id: string; createdAt: Date }>(rows: T[], cursor?: string, limit = 50) {
    const sorted = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1));
    const start = cursor ? Number(cursor) : 0;
    const items = sorted.slice(start, start + limit);
    return { items, nextCursor: start + limit < sorted.length ? String(start + limit) : null };
  }

  async list(i: ListInput) {
    this.lastList = i;
    return this.page(
      this.entries.filter(
        (e) =>
          (!i.companyId || e.companyId === i.companyId) &&
          (!i.module || e.module === i.module) &&
          (!i.actorId || e.actorId === i.actorId) &&
          (!i.from || e.createdAt >= i.from) &&
          (!i.to || e.createdAt <= i.to),
      ),
      i.cursor,
      i.limit,
    );
  }

  async listAuthEvents(i: { companyId?: string; cursor?: string; limit?: number }) {
    return this.page(this.authEvents.filter((e) => !i.companyId || e.companyId === i.companyId), i.cursor, i.limit);
  }
}
