import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addIndexRow, insertCssImport, pascal, registerSection } from "../../../scripts/lib/scaffold.mjs";

const css = '@import "tailwindcss";\n@import "../docs/design/tokens.css";\n@import "./ui-inputs.css";\n@import "./ui-history.css";\n';
const page = ['import { A } from "./sections/a";', 'import { B } from "./sections/b";', "", "const sections = [", '  { id: "a", title: "A", content: <A /> },', "];", ""].join("\n");

describe("scaffold", () => {
  it("pascal", () => expect(pascal("date-range")).toBe("DateRange"));
  it("inserta el import de CSS en orden alfabético y es idempotente", () => {
    const a = insertCssImport(css, "feedback");
    expect(a.text.split("\n").indexOf('@import "./ui-feedback.css";')).toBe(2);
    expect(insertCssImport(a.text, "feedback").changed).toBe(false);
    expect(insertCssImport(css, "zeta").text).toContain('ui-history.css";\n@import "./ui-zeta.css";');
  });
  it("registra la sección sin duplicar", () => {
    const r = registerSection(page, { id: "x", title: "X", component: "XSection", file: "x" });
    expect(r.text).toContain('import { XSection } from "./sections/x";');
    expect(r.text).toContain('content: <XSection /> },\n];');
    expect(registerSection(r.text, { id: "x", title: "X", component: "XSection", file: "x" }).changed).toBe(false);
  });
  it("añade la fila al índice", () => {
    const md = "## Componentes por patrón\n\n| P | C | E |\n|---|---|---|\n| a | b | c |\n\n## Reglas";
    const r = addIndexRow(md, "foo-bar");
    expect(r.text).toContain("| a | b | c |\n| TODO: cuándo usar FooBar | `FooBar` | `components/ui/foo-bar.tsx`");
    expect(addIndexRow(r.text, "foo-bar").changed).toBe(false);
  });
  it("--dry-run no crea archivos", () => {
    const out = execFileSync("node", ["scripts/new-ui-component.mjs", "zz-demo", "--client", "--css", "--dry-run"], { encoding: "utf8" });
    expect(out).toContain("+ components/ui/zz-demo.tsx");
    expect(existsSync("components/ui/zz-demo.tsx")).toBe(false);
  });
});
