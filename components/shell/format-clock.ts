export function formatClock(date: Date, timeZone?: string): string {
  const get = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es", { timeZone, ...opts }).formatToParts(date);
  const day = get({ weekday: "long", day: "numeric", month: "long" });
  const part = (parts: Intl.DateTimeFormatPart[], t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = part(day, "weekday");
  const time = get({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${part(day, "day")} de ${part(day, "month")} · ${part(time, "hour")}:${part(time, "minute")}`;
}
