import { isValidUsernameName } from "@/core/domain/username";

export const cleanUsername = (raw: string) => raw.toLowerCase().replace(/\s/g, "");

export type UsernameFormat = "empty" | "invalid" | "ok";

export function usernameFormat(name: string): UsernameFormat {
  if (!name) return "empty";
  return isValidUsernameName(name) ? "ok" : "invalid";
}

/** «Marta López» -> «marta-l»; empty when nothing valid can be derived. */
export function suggestUsername(displayName: string): string {
  const words = displayName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  if (words.length === 0) return "";
  const s = words.length > 1 ? `${words[0]}-${words[1][0]}` : words[0];
  return isValidUsernameName(s) ? s : "";
}

export type SiteGroup<T> = { site: string; stores: T[] };

export function groupBySite<T extends { site: string }>(stores: T[]): SiteGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const s of stores) groups.set(s.site, [...(groups.get(s.site) ?? []), s]);
  return [...groups].map(([site, list]) => ({ site, stores: list }));
}

export function groupState(selected: number, total: number): "all" | "some" | "none" {
  return selected === 0 ? "none" : selected === total ? "all" : "some";
}

export function checklist(input: { name: string; username: "ok" | "other"; hasRole: boolean; stores: number }) {
  const items = [
    { state: input.name.trim() ? "ok" : "todo", label: "Nombre de la persona" },
    { state: input.username === "ok" ? "ok" : "todo", label: "Nombre de usuario disponible" },
    { state: input.hasRole ? "ok" : "todo", label: "Rol elegido" },
    { state: input.stores > 0 ? "ok" : "todo", label: "Al menos una tienda" },
  ] as const;
  return { items: [...items], complete: items.every((i) => i.state === "ok") };
}
