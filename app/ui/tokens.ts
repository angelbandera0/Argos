import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Token = { name: string; value: string };

const css = readFileSync(join(process.cwd(), "docs/design/tokens.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const root = css.slice(0, css.indexOf("@media"));
const all: Token[] = [...root.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => ({
  name: m[1],
  value: m[2].trim().replace(/\s+/g, " "),
}));

export const tokens = (prefix: string) => all.filter((t) => t.name.startsWith(prefix));

export function resolve(value: string): string {
  const m = value.match(/^var\((--[a-z0-9-]+)\)$/);
  const ref = m && all.find((t) => t.name === m[1]);
  return ref ? resolve(ref.value) : value;
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
