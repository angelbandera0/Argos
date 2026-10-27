export const k = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function parseTranscript(text) {
  const messages = new Map();
  const calls = new Set();
  for (const line of text.split("\n")) {
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    const m = o.message;
    if (!m || m.role !== "assistant") continue;
    if (Array.isArray(m.content)) m.content.filter((b) => b.type === "tool_use").forEach((b) => calls.add(b.id));
    if (m.usage) messages.set(m.id ?? messages.size, m.usage);
  }
  const t = { calls: calls.size, output: 0, cacheWrite: 0, cacheRead: 0, input: 0, firstCtx: 0, lastCtx: 0, weighted: 0 };
  for (const u of messages.values()) {
    t.input += u.input_tokens ?? 0;
    t.output += u.output_tokens ?? 0;
    t.cacheWrite += u.cache_creation_input_tokens ?? 0;
    t.cacheRead += u.cache_read_input_tokens ?? 0;
    const ctx = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
    t.firstCtx ||= ctx;
    t.lastCtx = ctx;
  }
  t.weighted = Math.round(t.input + t.cacheWrite * 1.25 + t.cacheRead * 0.1 + t.output * 5);
  return t;
}

export function formatUsageLine(t) {
  return `llamadas ${t.calls} | contexto ${k(t.firstCtx)} -> ${k(t.lastCtx)} | salida ${k(t.output)} | escritura caché ${k(t.cacheWrite)} | lectura caché ${k(t.cacheRead)} | equivalente ponderado ${k(t.weighted)}`;
}

export function formatRow(t, { name, commits, status = "pendiente", tokens, duration, type = "`argos-dev` (Sonnet)", what = "implementación" }) {
  const parts = [`contexto ${k(t.firstCtx)} → ${k(t.lastCtx)}`, `${t.calls} llamadas`];
  if (duration) parts.push(`${duration} s`);
  const weighted = `equivalente ponderado ≈ ${k(Math.round(t.weighted / 1000) * 1000)}${tokens ? ` (subagent_tokens ${k(tokens)})` : ""}`;
  const cell = (s) => String(s).replace(/\|/g, "\\|");
  return `| ${[name, type, what, status, commits, `${parts.join(", ")}; ${weighted}`].map(cell).join(" | ")} |`;
}

export function insertRow(md, row, name, replace = false) {
  const lines = md.split("\n");
  const noteIdx = lines.findIndex((l) => l.startsWith("Nota de medición"));
  if (noteIdx < 0) throw new Error("No se encontró «Nota de medición»");
  const existing = lines.findIndex((l) => l.startsWith("|") && l.split("|")[1]?.trim() === name);
  if (existing >= 0) {
    if (!replace) return { md, status: "duplicate" };
    lines[existing] = row;
    return { md: lines.join("\n"), status: "replaced" };
  }
  let last = noteIdx - 1;
  while (last >= 0 && !lines[last].startsWith("|")) last--;
  lines.splice(last + 1, 0, row);
  return { md: lines.join("\n"), status: "added" };
}
