import { describe, expect, it } from "vitest";
import { filterCompanies, parseStatus, statusCounts } from "@/app/(app)/companias/company-filters";

const all = [
  { name: "La Casona", code: "lacasona", status: "active" as const },
  { name: "Café Central", code: "cafe", status: "inactive" as const },
  { name: "Panadería Sol", code: "sol", status: "active" as const },
];

describe("company filters", () => {
  it("parsea el estado con valor por defecto", () => {
    expect(parseStatus("activas")).toBe("activas");
    expect(parseStatus("x")).toBe("todas");
  });
  it("filtra por texto y estado", () => {
    expect(filterCompanies(all, "CAS", "todas")).toHaveLength(1);
    expect(filterCompanies(all, "", "inactivas").map((c) => c.code)).toEqual(["cafe"]);
    expect(filterCompanies(all, "", "activas")).toHaveLength(2);
  });
  it("cuenta por estado respetando la búsqueda", () => {
    expect(statusCounts(all, "")).toEqual({ todas: 3, activas: 2, inactivas: 1 });
    expect(statusCounts(all, "sol")).toEqual({ todas: 1, activas: 1, inactivas: 0 });
  });
});

describe("company sort and paging", () => {
  it("ordena por nombre, código y estado", async () => {
    const { sortCompanies } = await import("@/app/(app)/companias/company-filters");
    expect(sortCompanies(all, "nombre").map((c) => c.code)).toEqual(["cafe", "lacasona", "sol"]);
    expect(sortCompanies(all, "codigo").map((c) => c.code)).toEqual(["cafe", "lacasona", "sol"]);
    expect(sortCompanies(all, "estado").map((c) => c.code)).toEqual(["lacasona", "sol", "cafe"]);
  });
  it("valida orden y página, y acota la página", async () => {
    const { parseSort, parsePage, pageSlice } = await import("@/app/(app)/companias/company-filters");
    expect(parseSort("x")).toBe("nombre");
    expect(parsePage("0")).toBe(1);
    expect(pageSlice([1, 2, 3], 9, 2)).toEqual({ items: [3], page: 2 });
  });
});
