import type { ActorKind } from "@/core/domain/actor";

export const signOutPath = (kind: ActorKind | null): "/entrar" | "/login" =>
  kind === "operator" ? "/entrar" : "/login";
