import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { addIndexRow, componentTemplate, cssTemplate, insertCssImport, pascal, registerSection, sectionTemplate, testTemplate } from "./lib/scaffold.mjs";

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error("Usage: pnpm new:ui <nombre-en-kebab> [--client] [--css] [--dry-run]");
  process.exit(2);
}
const dry = args.includes("--dry-run");
const P = pascal(name);
const done = [];
const skipped = [];

const create = (path, text) => {
  if (existsSync(path)) return skipped.push(`${path} (ya existe)`);
  if (!dry) writeFileSync(path, text);
  done.push(`+ ${path}`);
};
const edit = (path, fn) => {
  const r = fn(readFileSync(path, "utf8"));
  if (!r.changed) return skipped.push(`${path} (ya registrado)`);
  if (!dry) writeFileSync(path, r.text);
  done.push(`~ ${path}`);
};

create(`components/ui/${name}.tsx`, componentTemplate(name, args.includes("--client")));
if (args.includes("--css")) {
  create(`app/ui-${name}.css`, cssTemplate(name));
  edit("app/globals.css", (s) => insertCssImport(s, name));
}
create(`app/ui/sections/${name}.tsx`, sectionTemplate(name));
edit("app/ui/page.tsx", (s) => registerSection(s, { id: name, title: P, component: `${P}Section`, file: name }));
edit("docs/design/PATRONES-UI.md", (s) => addIndexRow(s, name));
create(`tests/unit/ui-${name}.test.ts`, testTemplate(name));

console.log(`${dry ? "(dry-run) " : ""}${done.join("\n") || "nada que hacer"}`);
if (skipped.length) console.log(`omitido: ${skipped.join(", ")}`);
if (done.length && !dry) console.log("Recuerda: reinicia pnpm dev (borra .next) porque hay archivos nuevos. Pendiente: TODO en PATRONES-UI.md y descripción en la galería; documenta en DESIGN-resumen.md.");
