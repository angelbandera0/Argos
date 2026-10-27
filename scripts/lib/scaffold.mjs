export const pascal = (n) => n.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");

export function insertCssImport(css, name) {
  const line = `@import "./ui-${name}.css";`;
  if (css.includes(line)) return { text: css, changed: false };
  const lines = css.split("\n");
  const ui = lines.map((l, i) => [l, i]).filter(([l]) => /^@import "\.\/ui-[\w-]+\.css";/.test(l));
  const greater = ui.find(([l]) => l.match(/ui-([\w-]+)\.css/)[1] > name);
  const at = greater ? greater[1] : ui.length ? ui.at(-1)[1] + 1 : lines.findIndex((l) => l.includes("tokens.css")) + 1;
  lines.splice(at, 0, line);
  return { text: lines.join("\n"), changed: true };
}

export function registerSection(src, { id, title, component, file }) {
  if (src.includes(`id: "${id}"`)) return { text: src, changed: false };
  const lines = src.split("\n");
  const lastImport = lines.map((l, i) => [l, i]).filter(([l]) => /^import .* from "\.\/sections\//.test(l)).at(-1)?.[1];
  const arrEnd = lines.findIndex((l, i) => i > lines.findIndex((x) => x.startsWith("const sections = [")) && l === "];");
  if (lastImport === undefined || arrEnd < 0) throw new Error("No se encontró el array `sections` o los imports de secciones en app/ui/page.tsx");
  lines.splice(arrEnd, 0, `  { id: "${id}", title: "${title}", description: "TODO", content: <${component} /> },`);
  lines.splice(lastImport + 1, 0, `import { ${component} } from "./sections/${file}";`);
  return { text: lines.join("\n"), changed: true };
}

export function addIndexRow(md, name) {
  const file = `components/ui/${name}.tsx`;
  if (md.includes(`\`${file}\``)) return { text: md, changed: false };
  const lines = md.split("\n");
  const head = lines.findIndex((l) => l.startsWith("## Componentes por patrón"));
  if (head < 0) throw new Error("No se encontró «## Componentes por patrón» en PATRONES-UI.md");
  let last = head + 1;
  for (let i = head + 1; i < lines.length && !lines[i].startsWith("## "); i++) if (lines[i].startsWith("|")) last = i;
  lines.splice(last + 1, 0, `| TODO: cuándo usar ${pascal(name)} | \`${pascal(name)}\` | \`${file}\` (galería \`/ui\`) |`);
  return { text: lines.join("\n"), changed: true };
}

export function componentTemplate(name, client) {
  const P = pascal(name);
  return `${client ? '"use client";\n\n' : ""}import type { HTMLAttributes } from "react";

export type ${P}Props = HTMLAttributes<HTMLDivElement>;

export function ${P}({ className, ...props }: ${P}Props) {
  return <div className={\`ui-${name}\${className ? \` \${className}\` : ""}\`} {...props} />;
}
`;
}

export const sectionTemplate = (name) => {
  const P = pascal(name);
  return `import { ${P} } from "@/components/ui/${name}";
import { Specimen } from "../gallery";

export function ${P}Section() {
  return (
    <Specimen title="Por defecto">
      <${P} />
    </Specimen>
  );
}
`;
};

export const cssTemplate = (name) => `.ui-${name} {\n}\n`;
export const testTemplate = (name) => `import { describe } from "vitest";\n\ndescribe.todo("${pascal(name)}");\n`;
