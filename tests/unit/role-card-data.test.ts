import { describe, expect, it } from "vitest";
import { allowedCompanies, parseCompanyFilter, sessionLabel, usersLabel } from "@/components/roles/role-card-data";

describe("role card data", () => {
  it("formats the session", () => {
    expect(sessionLabel(null)).toBe("Tope de la compañía");
    expect(sessionLabel(8 * 3600)).toBe("8 horas");
    expect(sessionLabel(3600)).toBe("1 hora");
    expect(sessionLabel(5400)).toBe("1,5 horas");
  });
  it("formats the users", () => {
    expect(usersLabel(0)).toBe("Ninguno");
    expect(usersLabel(1)).toBe("1 usuario");
    expect(usersLabel(3)).toBe("3 usuarios");
  });
  it("removes excluded companies", () => {
    expect(allowedCompanies([{ id: "a" }, { id: "b" }], ["a"])).toEqual([{ id: "b" }]);
  });
  it("accepts only known company filters", () => {
    expect(parseCompanyFilter("a", ["a"])).toBe("a");
    expect(parseCompanyFilter("x", ["a"])).toBe("");
    expect(parseCompanyFilter(undefined, ["a"])).toBe("");
  });
});
