const MAX_SESSION_SECONDS = 86400;

export function effectiveExpiry(i: {
  startedAt: Date;
  companyCapSeconds: number;
  roleSeconds: number | null;
}): Date {
  const seconds = Math.min(
    MAX_SESSION_SECONDS,
    i.companyCapSeconds,
    i.roleSeconds ?? Infinity,
  );
  return new Date(i.startedAt.getTime() + seconds * 1000);
}

export function isExpired(now: Date, expiry: Date): boolean {
  return now.getTime() >= expiry.getTime();
}

export function formatSessionEnd(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(date);
}
