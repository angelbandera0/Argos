import { describe, expect, it } from "vitest";
import { formatRow, insertRow, k, parseTranscript } from "../../../scripts/lib/usage-stats.mjs";

const msg = (id: string, usage: object, content: object[] = []) => JSON.stringify({ message: { role: "assistant", id, content, usage } });
const fixture = [
  msg("a", { input_tokens: 10, output_tokens: 100, cache_creation_input_tokens: 1000, cache_read_input_tokens: 0 }, [{ type: "tool_use", id: "t1" }]),
  msg("a", { input_tokens: 10, output_tokens: 100, cache_creation_input_tokens: 1000, cache_read_input_tokens: 0 }),
  msg("b", { input_tokens: 5, output_tokens: 200, cache_creation_input_tokens: 500, cache_read_input_tokens: 1000 }, [{ type: "tool_use", id: "t2" }]),
  "basura",
].join("\n");

describe("usage-stats", () => {
  it("k separa miles", () => {
    expect(k(16815)).toBe("16.815");
    expect(k(999)).toBe("999");
  });
  it("parsea el transcript sin duplicar mensajes", () => {
    const t = parseTranscript(fixture);
    expect(t).toMatchObject({ calls: 2, output: 300, cacheWrite: 1500, cacheRead: 1000, firstCtx: 1010, lastCtx: 1505 });
    expect(t.weighted).toBe(Math.round(15 + 1875 + 100 + 1500));
  });
  it("formatea la fila", () => {
    const row = formatRow(parseTranscript(fixture), { name: "X", commits: "abc", tokens: "12345", duration: "30" });
    expect(row).toBe("| X | `argos-dev` (Sonnet) | implementación | pendiente | abc | contexto 1.010 → 1.505, 2 llamadas, 30 s; equivalente ponderado ≈ 3.000 (subagent_tokens 12.345) |");
  });
  it("inserta antes de la nota y evita duplicados", () => {
    const md = "| T | a |\n|---|---|\n| 1 x | y |\n\nNota de medición: z";
    const a = insertRow(md, "| 2 n | y |", "2 n");
    expect(a.md.split("\n")[3]).toBe("| 2 n | y |");
    expect(insertRow(a.md, "| 2 n | q |", "2 n").status).toBe("duplicate");
    expect(insertRow(a.md, "| 2 n | q |", "2 n", true).md).toContain("| 2 n | q |");
  });
});
