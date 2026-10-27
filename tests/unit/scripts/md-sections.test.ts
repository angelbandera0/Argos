import { describe, expect, it } from "vitest";
import { findSection, parseHeadings } from "../../../scripts/lib/md-sections.mjs";

const md = ["# Guía", "## 6. Componentes", "### 6.1 Botones", "texto", "```", "# no es encabezado", "```", "#### Detalle", "### 6.34 Datepicker [x]", "dp", "## 7. Gráficos", "g"].join("\n");

describe("md-sections", () => {
  it("lista encabezados ignorando bloques de código", () => {
    expect(parseHeadings(md).map((h) => h.title)).toEqual(["Guía", "6. Componentes", "6.1 Botones", "Detalle", "6.34 Datepicker [x]", "7. Gráficos"]);
  });
  it("busca por número incluyendo subsecciones", () => {
    expect(findSection(md, "6.1").text).toBe("### 6.1 Botones\ntexto\n```\n# no es encabezado\n```\n#### Detalle");
    expect(findSection(md, "6").text).toContain("6.34 Datepicker");
    expect(findSection(md, "6").text).not.toContain("Gráficos");
  });
  it("busca por título o subcadena", () => {
    expect(findSection(md, "6.34 Datepicker").text).toBe("### 6.34 Datepicker [x]\ndp");
    expect(findSection(md, "datepick").text).toContain("dp");
  });
  it("sin coincidencia o ambigua devuelve candidatos", () => {
    expect(findSection(md, "zzz").hits).toHaveLength(0);
    const r = findSection(md, "o");
    expect(r.text).toBeUndefined();
    expect(r.hits.length).toBeGreaterThan(1);
  });
});
