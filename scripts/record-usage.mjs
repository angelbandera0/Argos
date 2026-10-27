import { readFileSync, writeFileSync } from "node:fs";
import { formatRow, insertRow, parseTranscript } from "./lib/usage-stats.mjs";

const flags = { "--status": "status", "--tokens": "tokens", "--duration": "duration", "--type": "type", "--what": "what" };
const pos = [];
const opts = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (flags[argv[i]]) opts[flags[argv[i]]] = argv[++i];
  else if (argv[i].startsWith("--")) opts[argv[i].slice(2)] = true;
  else pos.push(argv[i]);
}
const [file, name, commits] = pos;
if (!file || !name || !commits) {
  console.error('Usage: pnpm consumo <.output> "<fila>" "<commits>" [--status s] [--tokens N] [--duration S] [--type q] [--what w] [--dry-run] [--replace]');
  process.exit(2);
}

const row = formatRow(parseTranscript(readFileSync(file, "utf8")), { name, commits, ...opts });
const path = "docs/superpowers/consumo.md";
const { md, status } = insertRow(readFileSync(path, "utf8"), row, name, !!opts.replace);
if (status === "duplicate") {
  console.error(`Ya existe una fila «${name}»; usa --replace para sustituirla.`);
  process.exit(1);
}
if (!opts["dry-run"]) writeFileSync(path, md);
console.log(`${opts["dry-run"] ? "(dry-run) " : `${status}: `}${row}`);
