import { readFileSync } from "node:fs";
import { findSection, parseHeadings } from "./lib/md-sections.mjs";

const argv = process.argv.slice(2);
let file = "docs/design/DESIGN.md";
const rest = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--file") file = argv[++i];
  else if (argv[i] === "--resumen") file = "docs/design/DESIGN-resumen.md";
  else rest.push(argv[i]);
}
const list = rest.includes("--list");
const query = rest.filter((a) => a !== "--list").join(" ");
if (!list && !query) {
  console.error("Usage: pnpm design:section <número|título> | --list  [--resumen] [--file ruta]");
  process.exit(2);
}

const md = readFileSync(file, "utf8");
if (list) {
  for (const h of parseHeadings(md)) console.log(`${String(h.line).padStart(4)} ${"  ".repeat(h.level - 1)}${h.title}`);
  process.exit(0);
}
const r = findSection(md, query);
if (r.text === undefined) {
  console.error(r.hits.length ? `Ambiguo «${query}»:` : `Sin coincidencias para «${query}» en ${file}; prueba --list`);
  r.hits.forEach((h) => console.error(`  ${h.line} ${h.title}`));
  process.exit(1);
}
console.log(r.text);
