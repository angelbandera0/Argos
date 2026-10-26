import type { AuthEventEntry, AuthEventFilter, HistoryEntry, HistoryFilter, HistoryReader } from "@/core/application/ports/history-reader";

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

  private match(i: HistoryFilter) {
    return this.entries.filter(
      (e) =>
        (!i.companyId || e.companyId === i.companyId) &&
        (!i.module || e.module === i.module) &&
        (!i.modules || i.modules.includes(e.module)) &&
        (!i.actorId || e.actorId === i.actorId) &&
        (!i.actions?.length || i.actions.includes(e.action)) &&
        (!i.channel || e.channel === i.channel) &&
        (!i.from || e.createdAt >= i.from) &&
        (!i.to || e.createdAt < i.to),
    );
  }

  private matchAuth(i: AuthEventFilter) {
    return this.authEvents.filter(
      (e) =>
        (!i.companyId || e.companyId === i.companyId) &&
        (!i.userId || e.userId === i.userId) &&
        (!i.events?.length || i.events.includes(e.event)) &&
        (!i.channel || e.channel === i.channel) &&
        (!i.from || e.createdAt >= i.from) &&
        (!i.to || e.createdAt < i.to),
    );
  }

  async list(i: ListInput) {
    this.lastList = i;
    return this.page(this.match(i), i.cursor, i.limit);
  }

  async countByModule(i: Omit<HistoryFilter, "module" | "modules"> & { modules: string[] }) {
    return Object.fromEntries(i.modules.map((m) => [m, this.match({ ...i, module: m }).length]));
  }

  async listAuthEvents(i: AuthEventFilter & { cursor?: string; limit?: number }) {
    return this.page(this.matchAuth(i), i.cursor, i.limit);
  }

  async countAuthEvents(i: AuthEventFilter) {
    return this.matchAuth(i).length;
  }
}
