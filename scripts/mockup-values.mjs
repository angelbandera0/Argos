import { readFileSync } from "node:fs";
import { parseTokens, summarize } from "./lib/mockup.mjs";

const argv = process.argv.slice(2);
const file = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--max-lines");
if (!file) {
  console.error("Usage: pnpm mockup <ruta .dc.html> [--raw-values] [--text] [--max-lines N]");
  process.exit(2);
}
const ml = argv.indexOf("--max-lines");
console.log(
  summarize(readFileSync(file, "utf8"), parseTokens(readFileSync("docs/design/tokens.css", "utf8")), {
    rawValues: argv.includes("--raw-values"),
    onlyText: argv.includes("--text"),
    maxLines: ml >= 0 ? Number(argv[ml + 1]) : 0,
  }),
);
