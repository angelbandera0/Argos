import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: pnpm usage <ruta al .output del subagente>");
  process.exit(2);
}

const messages = new Map();
const calls = new Set();
const t = { calls: 0, output: 0, cacheWrite: 0, cacheRead: 0, input: 0, firstCtx: 0, lastCtx: 0 };
for (const line of readFileSync(file, "utf8").split("\n")) {
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
t.calls = calls.size;
for (const u of messages.values()) {
  t.input += u.input_tokens ?? 0;
  t.output += u.output_tokens ?? 0;
  t.cacheWrite += u.cache_creation_input_tokens ?? 0;
  t.cacheRead += u.cache_read_input_tokens ?? 0;
  const ctx = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
  t.firstCtx ||= ctx;
  t.lastCtx = ctx;
}
const weighted = Math.round(t.input + t.cacheWrite * 1.25 + t.cacheRead * 0.1 + t.output * 5);
const k = (n) => n.toLocaleString("es-ES");
console.log(
  `llamadas ${t.calls} | contexto ${k(t.firstCtx)} -> ${k(t.lastCtx)} | salida ${k(t.output)} | escritura caché ${k(t.cacheWrite)} | lectura caché ${k(t.cacheRead)} | equivalente ponderado ${k(weighted)}`,
);
