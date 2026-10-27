export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export const profileSubtitle = (handle: string | null | undefined, role: string) =>
  handle ? `${handle} · ${role}` : role;
