import type { Channel } from "@/core/domain/actor";

/** The table also records `system` writes (no user) and rows without an actor, hence the wider channel and nullable actorId. */
export type HistoryChannel = Channel | "system";

export interface HistoryEntry {
  id: string;
  module: string;
  entityType: string;
  entityId: string;
  action: "create" | "update" | "deactivate" | "reactivate" | "delete";
  actorId: string | null;
  storeId: string | null;
  channel: HistoryChannel;
  before: unknown;
  after: unknown;
  createdAt: Date;
}

export interface AuthEventEntry {
  id: string;
  userId: string | null;
  usernameAttempted: string | null;
  event: "login_ok" | "login_failed" | "locked" | "unlocked" | "pin_reset" | "password_changed";
  actorId: string | null;
  channel: HistoryChannel;
  createdAt: Date;
}

export interface HistoryPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface HistoryFilter {
  companyId?: string;
  module?: string;
  modules?: string[];
  actorId?: string;
  actions?: string[];
  channel?: string;
  from?: Date;
  /** Exclusive. */
  to?: Date;
}

export interface AuthEventFilter {
  companyId?: string;
  userId?: string;
  events?: string[];
  channel?: string;
  from?: Date;
  /** Exclusive. */
  to?: Date;
}

/** Newest first (created_at desc, id desc); `cursor` is opaque. Without `companyId` (superadmin) every visible company is read. */
export interface HistoryReader {
  list(i: HistoryFilter & { cursor?: string; limit?: number }): Promise<HistoryPage<HistoryEntry>>;
  countByModule(i: Omit<HistoryFilter, "module" | "modules"> & { modules: string[] }): Promise<Record<string, number>>;
  listAuthEvents(i: AuthEventFilter & { cursor?: string; limit?: number }): Promise<HistoryPage<AuthEventEntry>>;
  countAuthEvents(i: AuthEventFilter): Promise<number>;
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;
