import { describe, expect, it } from "vitest";
import { bellCount, bellLabel, relativeTime } from "@/components/notifications/notification-logic";

const now = Date.parse("2026-11-06T12:00:00Z");
const ago = (min: number) => new Date(now - min * 60_000).toISOString();

describe("notification-logic", () => {
  it("limita el contador a 9+", () => {
    expect(bellCount(3)).toBe("3");
    expect(bellCount(9)).toBe("9");
    expect(bellCount(10)).toBe("9+");
  });
  it("etiqueta accesible con el número", () => {
    expect(bellLabel(3)).toBe("Notificaciones, 3 sin leer");
    expect(bellLabel(0)).toBe("Notificaciones, sin leer");
  });
  it("texto relativo", () => {
    expect(relativeTime(ago(0), now)).toBe("ahora");
    expect(relativeTime(ago(5), now)).toBe("hace 5 min");
    expect(relativeTime(ago(180), now)).toBe("hace 3 h");
    expect(relativeTime(ago(60 * 24 * 2), now)).toBe("hace 2 d");
  });
});
