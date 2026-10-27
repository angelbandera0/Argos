export interface AppSession {
  sessionId: string;
  userId: string;
  startedAt: Date;
  activeStoreId: string | null;
  endedAt: Date | null;
}

export interface SessionRepository {
  start(i: { sessionId: string; userId: string; startedAt: Date }): Promise<void>;
  setActiveStore(sessionId: string, storeId: string): Promise<void>;
  end(sessionId: string): Promise<void>;
  get(sessionId: string): Promise<AppSession | null>;
}
