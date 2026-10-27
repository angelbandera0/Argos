import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseTokens, summarize } from "../../../scripts/lib/mockup.mjs";

const frag = `<html><head><title>Demo</title></head><body><x-dc><helmet><style>a:hover{color:#B3221B}</style></helmet>
<header><h1 style="font-size: 40px; font-weight: 600">Hola</h1></header>
<button type="button" disabled style="padding: 8px 16px; border-radius: 9999px; background: #d92d25; box-shadow: 0 2px 8px rgba(0,0,0,.1)">Guardar</button>
<sc-for list="{{rows}}" as="r"><span>{{r.name}}</span></sc-for></x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1200,"height":900}}'>const t = 'Venta anulada';</script></body></html>`;
const tokens = parseTokens("--color-red-strong: #D92D25; --color-red-hover: #B3221B;");

describe("mockup", () => {
  it("parsea tokens", () => expect(tokens["#d92d25"]).toBe("--color-red-strong"));
  it("resume valores, textos y estados", () => {
    const out = summarize(frag, tokens);
    expect(out).toContain("Demo — artboard 1200×900");
    expect(out).toContain("#d92d25=--color-red-strong");
    expect(out).toContain("40px ×1");
    expect(out).toContain("9999px ×1");
    expect(out).toContain("- Guardar");
    expect(out).toContain("- Venta anulada");
    expect(out).toMatch(/hover×1.*disabled×1/);
  });
  it("flags", () => {
    expect(summarize(frag, tokens, { onlyText: true })).not.toContain("colores");
    expect(summarize(frag, tokens, { rawValues: true })).toMatch(/^colores/);
    expect(summarize(frag, tokens, { maxLines: 2 }).split("\n")).toHaveLength(2);
  });
  it("humo sobre Comp-Botones", () => {
    const out = summarize(readFileSync("docs/design/components/mockups/Comp-Botones.dc.html", "utf8"), parseTokens(readFileSync("docs/design/tokens.css", "utf8")));
    expect(out.split(/\s+/).length).toBeLessThan(4000);
    expect(out).toContain("=--color-");
  });
});
