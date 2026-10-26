import { initials } from "@/components/shell/initials";

export const AVATAR_TONES = 4;

export const companyInitials = (name: string) => initials(name).slice(0, 2) || "?";

export function avatarTone(code: string): number {
  let h = 0;
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return h % AVATAR_TONES;
}
