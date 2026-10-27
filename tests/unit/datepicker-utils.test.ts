import { describe, expect, it } from "vitest";
import {
  addDays, addMonths, addYears, clampIso, compareIso, daysInMonth, endOfWeek, formatDisplay, formatLong, formatShortRange, isDisabledDay,
  isInRange, isValidIso, maskDisplay, monthMatrix, monthTitle, normalizeRange, orderRange, parseDisplay, parseIso, pickRangeDay, presetRanges,
  rangeDays, startOfWeek, todayIso, typedRangeError, weekdayIndex,
} from "@/components/ui/datepicker-utils";

describe("fechas ISO", () => {
  it("valida estrictamente", () => {
    expect(isValidIso("2026-10-26")).toBe(true);
    expect(isValidIso("2026-02-29")).toBe(false);
    expect(isValidIso("2024-02-29")).toBe(true);
    expect(isValidIso("2100-02-29")).toBe(false);
    expect(isValidIso("2000-02-29")).toBe(true);
    expect(isValidIso("2026-13-01")).toBe(false);
    expect(isValidIso("2026-00-10")).toBe(false);
    expect(isValidIso("2026-4-5")).toBe(false);
    expect(isValidIso("")).toBe(false);
    expect(parseIso("2026-10-26")).toEqual({ y: 2026, m: 10, d: 26 });
  });
  it("cuenta los días del mes con bisiestos", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
  it("compara y ordena", () => {
    expect(compareIso("2026-01-01", "2026-01-02")).toBe(-1);
    expect(compareIso("2026-01-02", "2026-01-02")).toBe(0);
    expect(compareIso("2027-01-01", "2026-12-31")).toBe(1);
    expect(orderRange("2026-10-26", "2026-10-20")).toEqual({ from: "2026-10-20", to: "2026-10-26" });
    expect(orderRange("2026-10-20", "2026-10-26")).toEqual({ from: "2026-10-20", to: "2026-10-26" });
  });
  it("usa la fecha local, no UTC", () => {
    expect(todayIso(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
    expect(todayIso(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });
});

describe("aritmética", () => {
  it("suma días cruzando mes y año", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-10-26", 7)).toBe("2026-11-02");
  });
  it("suma meses ajustando el fin de mes", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
    expect(addMonths("2026-01-15", -13)).toBe("2024-12-15");
  });
  it("suma años con 29 de febrero", () => {
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28");
    expect(addYears("2024-02-29", 4)).toBe("2028-02-29");
    expect(addYears("2026-10-26", -1)).toBe("2025-10-26");
  });
  it("la semana empieza el lunes", () => {
    expect(weekdayIndex("2026-10-26")).toBe(0);
    expect(weekdayIndex("2026-10-25")).toBe(6);
    expect(startOfWeek("2026-10-25")).toBe("2026-10-19");
    expect(startOfWeek("2026-10-26")).toBe("2026-10-26");
    expect(endOfWeek("2026-10-26")).toBe("2026-11-01");
    expect(endOfWeek("2026-11-01")).toBe("2026-11-01");
  });
  it("cuenta los días de un rango", () => {
    expect(rangeDays("2026-10-20", "2026-10-26")).toBe(7);
    expect(rangeDays("2026-10-26", "2026-10-26")).toBe(1);
    expect(rangeDays("2026-02-27", "2026-03-02")).toBe(4);
    expect(rangeDays("2026-10-26", "")).toBe(0);
  });
});

describe("matriz del mes", () => {
  it("tiene 6 semanas de 7 días empezando en lunes", () => {
    const m = monthMatrix(2026, 10);
    expect(m).toHaveLength(6);
    m.forEach((w) => expect(w).toHaveLength(7));
    expect(m[0][0].iso).toBe("2026-09-28");
    expect(m[0][3]).toEqual({ iso: "2026-10-01", inMonth: true });
    expect(m[0][0].inMonth).toBe(false);
    expect(m[5][6].iso).toBe("2026-11-08");
  });
  it("cuando el 1 es lunes no hay relleno previo", () => {
    expect(monthMatrix(2026, 6)[0][0]).toEqual({ iso: "2026-06-01", inMonth: true });
  });
  it("cuando el 1 es domingo hay seis días previos", () => {
    const m = monthMatrix(2026, 2);
    expect(m[0][6]).toEqual({ iso: "2026-02-01", inMonth: true });
    expect(m[0][0].iso).toBe("2026-01-26");
  });
  it("cubre el cambio de año y febrero bisiesto", () => {
    expect(monthMatrix(2026, 12).flat().filter((c) => c.inMonth)).toHaveLength(31);
    expect(monthMatrix(2024, 2).flat().filter((c) => c.inMonth)).toHaveLength(29);
    expect(monthMatrix(2026, 12)[5][6].iso).toBe("2027-01-10");
  });
});

describe("rangos y límites", () => {
  it("normaliza rangos invertidos", () => {
    expect(normalizeRange("2026-10-26", "2026-10-20")).toEqual({ from: "2026-10-20", to: "2026-10-26" });
  });
  it("rechaza fechas inválidas", () => {
    expect(normalizeRange("2026-02-30", "2026-03-01")).toBeNull();
    expect(normalizeRange("", "2026-03-01")).toBeNull();
  });
  it("recorta a min y max", () => {
    expect(normalizeRange("2026-10-01", "2026-10-30", "2026-10-10", "2026-10-20")).toEqual({ from: "2026-10-10", to: "2026-10-20" });
    expect(normalizeRange("2026-09-01", "2026-09-30", "2026-10-10")).toBeNull();
    expect(normalizeRange("2026-11-01", "2026-11-30", undefined, "2026-10-31")).toBeNull();
  });
  it("detecta días deshabilitados y recorta", () => {
    expect(isDisabledDay("2026-10-09", "2026-10-10", "2026-10-20")).toBe(true);
    expect(isDisabledDay("2026-10-10", "2026-10-10", "2026-10-20")).toBe(false);
    expect(isDisabledDay("2026-10-21", "2026-10-10", "2026-10-20")).toBe(true);
    expect(isDisabledDay("2026-10-21")).toBe(false);
    expect(clampIso("2026-10-01", "2026-10-10", "2026-10-20")).toBe("2026-10-10");
    expect(clampIso("2026-10-30", "2026-10-10", "2026-10-20")).toBe("2026-10-20");
    expect(clampIso("2026-10-15", "2026-10-10", "2026-10-20")).toBe("2026-10-15");
  });
  it("incluye los extremos del tramo", () => {
    expect(isInRange("2026-10-20", "2026-10-20", "2026-10-26")).toBe(true);
    expect(isInRange("2026-10-26", "2026-10-20", "2026-10-26")).toBe(true);
    expect(isInRange("2026-10-27", "2026-10-20", "2026-10-26")).toBe(false);
    expect(isInRange("2026-10-20", "2026-10-20", "")).toBe(false);
  });
  it("elige el rango con dos clics, intercambiando si hace falta", () => {
    const first = pickRangeDay({ from: "", to: "" }, "2026-10-20");
    expect(first).toEqual({ from: "2026-10-20", to: "" });
    expect(pickRangeDay(first, "2026-10-26")).toEqual({ from: "2026-10-20", to: "2026-10-26" });
    expect(pickRangeDay(first, "2026-10-10")).toEqual({ from: "2026-10-10", to: "2026-10-20" });
    expect(pickRangeDay(first, "2026-10-20")).toEqual({ from: "2026-10-20", to: "2026-10-20" });
    expect(pickRangeDay({ from: "2026-10-10", to: "2026-10-20" }, "2026-10-15")).toEqual({ from: "2026-10-15", to: "" });
  });
  it("marca el rango escrito al revés", () => {
    expect(typedRangeError("2026-10-26", "2026-10-20")).toBe(true);
    expect(typedRangeError("2026-10-20", "2026-10-20")).toBe(false);
    expect(typedRangeError("2026-10-20", "")).toBe(false);
  });
});

describe("formato dd/mm/aaaa", () => {
  it("formatea y parsea", () => {
    expect(formatDisplay("2026-10-05")).toBe("05/10/2026");
    expect(formatDisplay("")).toBe("");
    expect(formatDisplay("basura")).toBe("");
    expect(parseDisplay("05/10/2026")).toBe("2026-10-05");
    expect(parseDisplay(" 29/02/2024 ")).toBe("2024-02-29");
  });
  it("rechaza entradas inválidas", () => {
    for (const t of ["31/02/2026", "29/02/2026", "5/10/2026", "05-10-2026", "05/10/26", "00/10/2026", "32/01/2026", "10/13/2026", "", "ab/cd/efgh"]) {
      expect(parseDisplay(t)).toBeNull();
    }
  });
  it("inserta las barras al escribir", () => {
    expect(maskDisplay("2")).toBe("2");
    expect(maskDisplay("261")).toBe("26/1");
    expect(maskDisplay("2610")).toBe("26/10");
    expect(maskDisplay("26102")).toBe("26/10/2");
    expect(maskDisplay("26102026999")).toBe("26/10/2026");
    expect(maskDisplay("26/10/2026")).toBe("26/10/2026");
    expect(maskDisplay("a2b6")).toBe("26");
  });
  it("describe las fechas en español", () => {
    expect(formatLong("2026-10-26", "2026-10-26")).toBe("26 de octubre de 2026, hoy");
    expect(formatLong("2026-10-27", "2026-10-26")).toBe("27 de octubre de 2026");
    expect(monthTitle(2026, 10)).toBe("Octubre 2026");
    expect(formatShortRange("2026-10-20", "2026-10-26")).toBe("20 – 26 oct 2026");
    expect(formatShortRange("2026-09-20", "2026-10-26")).toBe("20 sep – 26 oct 2026");
    expect(formatShortRange("2025-12-20", "2026-01-05")).toBe("20 dic 2025 – 5 ene 2026");
    expect(formatShortRange("2026-10-26", "2026-10-26")).toBe("26 oct 2026");
  });
});

describe("atajos", () => {
  const p = (base: string) => Object.fromEntries(presetRanges(base).map((r) => [r.id, [r.from, r.to]]));
  it("se calculan sobre la fecha base", () => {
    const r = p("2026-10-26");
    expect(r.hoy).toEqual(["2026-10-26", "2026-10-26"]);
    expect(r.ayer).toEqual(["2026-10-25", "2026-10-25"]);
    expect(r["7d"]).toEqual(["2026-10-20", "2026-10-26"]);
    expect(r["30d"]).toEqual(["2026-09-27", "2026-10-26"]);
    expect(r.mes).toEqual(["2026-10-01", "2026-10-26"]);
    expect(r["mes-pasado"]).toEqual(["2026-09-01", "2026-09-30"]);
  });
  it("cruzan el año y febrero bisiesto", () => {
    const r = p("2027-01-01");
    expect(r.ayer).toEqual(["2026-12-31", "2026-12-31"]);
    expect(r["mes-pasado"]).toEqual(["2026-12-01", "2026-12-31"]);
    expect(p("2024-03-10")["mes-pasado"]).toEqual(["2024-02-01", "2024-02-29"]);
    expect(rangeDays(...(p("2026-10-26")["7d"] as [string, string]))).toBe(7);
    expect(rangeDays(...(p("2026-10-26")["30d"] as [string, string]))).toBe(30);
  });
});
