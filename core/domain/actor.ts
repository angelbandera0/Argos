export type ActorKind = "superadmin" | "admin" | "operator";

export type Channel = "ui" | "api" | "app" | "mcp";

export interface Actor {
  userId: string;
  kind: ActorKind;
  channel: Channel;
  activeStoreId?: string;
  /** The operator's app session (operators only). */
  sessionId?: string;
}
