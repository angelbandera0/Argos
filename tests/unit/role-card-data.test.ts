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

import { companiesLabel, ROLE_ACTIONS, roleCardData } from "@/components/roles/role-card-data";

describe("role card summary", () => {
  it("shows only companies, session and users", () => {
    expect(roleCardData({ companies: ["A", "B"], sessionSeconds: null, usersCount: 2 })).toEqual([
      { label: "Compañías", value: "2 compañías" },
      { label: "Sesión", value: "Tope de la compañía" },
      { label: "Usuarios", value: "2 usuarios" },
    ]);
    expect(companiesLabel("all")).toBe("Todas");
    expect(companiesLabel([])).toBe("Ninguna");
  });
  it("puts edit next to delete", () => {
    expect(ROLE_ACTIONS).toEqual(["edit", "delete"]);
  });
});
