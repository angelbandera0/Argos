import { describe, expect, it } from "vitest";
import { filterSites } from "@/app/(app)/companias/[id]/sites-filter";

const sites = [
  { name: "Centro", stores: [{ name: "Caja 1" }] },
  { name: "Norte", stores: [] },
];

describe("filterSites", () => {
  it("devuelve todo sin búsqueda", () => expect(filterSites(sites, "  ")).toHaveLength(2));
  it("coincide por sede o tienda sin importar mayúsculas", () => {
    expect(filterSites(sites, "norte")).toEqual([sites[1]]);
    expect(filterSites(sites, "CAJA")).toEqual([sites[0]]);
  });
  it("sin coincidencias devuelve vacío", () => expect(filterSites(sites, "zzz")).toEqual([]));
});
