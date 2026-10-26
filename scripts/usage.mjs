import { readFileSync } from "node:fs";
import { formatUsageLine, parseTranscript } from "./lib/usage-stats.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: pnpm usage <ruta al .output del subagente>");
  process.exit(2);
}

console.log(formatUsageLine(parseTranscript(readFileSync(file, "utf8"))));
