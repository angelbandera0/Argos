import type { Clock } from "@/core/application/ports/clock";
import type { AppSession, SessionRepository } from "@/core/application/ports/session-repository";

export class InMemorySessions implements SessionRepository {
  readonly sessions = new Map<string, AppSession>();
  readonly startCalls: Array<{ sessionId: string; userId: string; startedAt: Date }> = [];

  constructor(private readonly clock: Clock) {}

  async start(i: { sessionId: string; userId: string; startedAt: Date }): Promise<void> {
    this.startCalls.push(i);
    this.sessions.set(i.sessionId, { ...i, activeStoreId: null, endedAt: null });
  }

  async setActiveStore(sessionId: string, storeId: string): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (s) this.sessions.set(sessionId, { ...s, activeStoreId: storeId });
  }

  async end(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (s && s.endedAt === null) this.sessions.set(sessionId, { ...s, endedAt: this.clock.now() });
  }

  async get(sessionId: string): Promise<AppSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }
}
