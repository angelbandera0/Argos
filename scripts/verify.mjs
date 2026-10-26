import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = new Set(process.argv.slice(2));
const noBuild = args.has("--fast") || args.has("--no-build");
const strip = (s) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");

function newest(dir) {
  let m = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    m = Math.max(m, e.isDirectory() ? newest(p) : statSync(p).mtimeMs);
  }
  return m;
}

function typesStale() {
  const f = [".next/types/routes.d.ts", ".next/dev/types/routes.d.ts"].find(existsSync);
  return !f || statSync(f).mtimeMs < newest("app");
}

function nextDevRunning() {
  const ps = spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" }).stdout ?? "";
  return ps.split("\n").some((l) => /next(-server| dev)/.test(l) && /\bdev\b|next-server/.test(l) && !/verify/.test(l));
}

const steps = [];
if (typesStale()) steps.push(["typegen", "pnpm exec next typegen"]);
steps.push(["lint", "pnpm -s lint"], ["typecheck", "pnpm -s typecheck"], ["test", "pnpm -s test"]);
if (args.has("--int")) steps.push(["test:int", "pnpm -s test:int"]);
if (args.has("--db")) steps.push(["test:db", "pnpm -s test:db"]);
if (!noBuild) {
  steps.push(["build", "pnpm -s build"]);
  if (nextDevRunning()) console.log("! hay un `next dev` activo: `build` puede corromper su caché .next; usa --fast");
}

const counts = [];
const t0 = Date.now();
for (const [name, cmd] of steps) {
  const s = Date.now();
  const r = spawnSync(cmd, { shell: true, encoding: "utf8", maxBuffer: 1 << 28 });
  const out = strip(`${r.stdout ?? ""}\n${r.stderr ?? ""}`);
  const secs = ((Date.now() - s) / 1000).toFixed(1);
  if (r.status !== 0) {
    console.log(`✗ ${name} ${secs}s`);
    const lines = out.split("\n").filter((l) => l.trim());
    console.log(lines.slice(-25).join("\n"));
    process.exit(r.status || 1);
  }
  console.log(`✓ ${name} ${secs}s`);
  if (name === "test") {
    const files = /Test Files\s+(?:\d+ failed \| )?(\d+) passed/.exec(out)?.[1];
    const tests = /Tests\s+(?:\d+ failed \| )?(\d+) passed/.exec(out)?.[1];
    if (files) counts.push(`pruebas: ${files} archivos, ${tests} casos`);
  }
}
console.log(`verify OK ${((Date.now() - t0) / 1000).toFixed(1)}s${counts.length ? ` | ${counts.join(" | ")}` : ""}`);
