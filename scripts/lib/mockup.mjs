const PROPS = {
  "tamaños de fuente": ["font-size"],
  pesos: ["font-weight"],
  "texto (altura de línea, tracking)": ["line-height", "letter-spacing"],
  espaciados: ["padding", "padding-top", "padding-bottom", "padding-left", "padding-right", "margin", "margin-top", "margin-bottom", "margin-left", "margin-right", "gap", "row-gap", "column-gap"],
  radios: ["border-radius"],
  sombras: ["box-shadow"],
  "alturas/anchos": ["width", "height", "min-width", "min-height", "max-width", "max-height"],
  transiciones: ["transition", "animation"],
};
const STATES = ["hover", "focus", "focus-visible", "disabled", "error", "invalid", "selected", "active", "checked", "loading", "readonly", "pressed", "expanded", "open", "empty"];
const SIG = new Set("x-dc header section nav main aside footer table thead tbody tr th td h1 h2 h3 h4 button input select textarea label a form sc-for sc-if ul ol dialog svg".split(" "));
const VOID = new Set("input img br hr link meta source".split(" "));
const ent = (s) => s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const top = (map, n) => [...map].sort((a, b) => b[1] - a[1]).slice(0, n);
const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);

export function normHex(h) {
  h = h.toLowerCase();
  if (h.length === 4 || h.length === 5) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
  return h;
}

export function parseTokens(css) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) map[normHex(m[2])] ??= m[1];
  return map;
}

export function extract(html) {
  const blocks = (re) => [...html.matchAll(re)].map((m) => m[1]);
  const scripts = blocks(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi);
  const styles = blocks(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  const markup = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(helmet|head|html|body)[^>]*>/gi, "")
    .replace(/<link[^>]*>|<meta[^>]*>/gi, "");
  return { scripts, styles, markup, all: [html].join("\n") };
}

export function values(html, tokens = {}) {
  const groups = Object.fromEntries(Object.keys(PROPS).map((g) => [g, new Map()]));
  const byProp = Object.fromEntries(Object.entries(PROPS).flatMap(([g, ps]) => ps.map((p) => [p, g])));
  for (const m of html.matchAll(/(?<![\w-])([a-z][a-z-]*)\s*:\s*([^;"'`{}\n<>]{1,80})/g)) {
    const g = byProp[m[1]];
    const v = m[2].trim().replace(/\s+/g, " ");
    if (g && v && !v.includes("{{")) bump(groups[g], v);
  }
  const colors = new Map();
  for (const m of html.matchAll(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]*\)/g)) bump(colors, m[0].startsWith("#") ? normHex(m[0]) : m[0].replace(/\s+/g, ""));
  return { colors: top(colors, 40).map(([c, n]) => ({ value: c, count: n, token: tokens[c] })), groups: Object.fromEntries(Object.entries(groups).map(([g, m]) => [g, top(m, 12)])) };
}

export function texts(markup, scripts = []) {
  const out = new Set();
  const plain = markup.replace(/<svg[\s\S]*?<\/svg>/gi, "\n").replace(/<[^>]+>/g, "\n");
  for (const raw of plain.split("\n")) {
    const t = ent(raw).replace(/\{\{.*?\}\}/g, "").replace(/\s+/g, " ").trim();
    if (t.length >= 2 && /\p{L}/u.test(t)) out.add(t);
  }
  for (const s of scripts)
    for (const m of s.matchAll(/(['"])([A-ZÁÉÍÓÚÑ¿¡][^'"`<>{}=;\\\n]{2,50})\1/g)) if (/\s|[áéíóúñ]/.test(m[2]) || m[2].length > 4) out.add(m[2]);
  return [...out];
}

export function outline(markup) {
  const lines = new Map();
  const stack = [];
  let skip = 0;
  let depth = 0;
  for (const m of markup.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g)) {
    const [, close, tag, attrs, selfClose, txt] = m;
    if (txt !== undefined) {
      const last = stack.at(-1);
      if (last && !last.text && !skip) last.text = ent(txt).replace(/\{\{.*?\}\}/g, "…").replace(/\s+/g, " ").trim().slice(0, 30);
      continue;
    }
    const t = tag.toLowerCase();
    if (skip) {
      if (t === "svg") skip += close ? -1 : 1;
      continue;
    }
    if (close) {
      const i = stack.map((s) => s.tag).lastIndexOf(t);
      if (i >= 0) {
        const n = stack.splice(i)[0];
        if (n.emitted) depth--;
        if (n.line) n.line.text = n.text;
      }
      continue;
    }
    const sig = SIG.has(t);
    let line;
    if (sig) {
      const a = [...attrs.matchAll(/\s(type|role|aria-[\w-]+|disabled|placeholder|list|as|data-[\w-]+|id|href)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g)]
        .filter((x) => x[1] !== "data-props")
        .map((x) => (x[2] ?? x[3] ?? x[4] ? `${x[1]}=${(x[2] ?? x[3] ?? x[4]).slice(0, 30)}` : x[1]))
        .join(" ");
      line = { indent: depth, tag: t, attrs: a, text: "" };
      const key = `${depth}|${t}|${a}`;
      const prev = lines.get(key);
      if (prev) {
        prev.n++;
        line = null;
      } else {
        line.n = 1;
        lines.set(key, line);
      }
    }
    if (t === "svg") {
      if (!(selfClose || attrs.endsWith("/"))) skip = 1;
      continue;
    }
    if (VOID.has(t) || selfClose || attrs.endsWith("/")) continue;
    stack.push({ tag: t, emitted: sig && line !== null && true, line, text: "" });
    if (sig && line !== null) depth++;
    else if (sig) stack.at(-1).emitted = false;
  }
  return [...lines.values()].map((l) => `${"  ".repeat(l.indent)}${l.tag}${l.attrs ? ` [${l.attrs}]` : ""}${l.text ? ` "${l.text}"` : ""}${l.n > 1 ? ` ×${l.n}` : ""}`);
}

export function states(html) {
  const out = [];
  for (const s of STATES) {
    const n = (html.match(new RegExp(`(?<![\\w])${s}(?![\\w])`, "gi")) ?? []).length;
    if (n) out.push(`${s}×${n}`);
  }
  return out;
}

export function summarize(html, tokens = {}, { rawValues = false, onlyText = false, maxLines = 0 } = {}) {
  const { scripts, markup } = extract(html);
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
  const size = /"\$preview"\s*:\s*\{\s*"width"\s*:\s*(\d+)\s*,\s*"height"\s*:\s*(\d+)/.exec(html);
  const v = values(html, tokens);
  const fmt = (arr) => arr.map(([val, n]) => `${val} ×${n}`).join(" | ");
  const valueLines = [
    `colores: ${v.colors.map((c) => `${c.value}${c.token ? `=${c.token}` : ""} ×${c.count}`).join(" | ")}`,
    ...Object.entries(v.groups).filter(([, a]) => a.length).map(([g, a]) => `${g}: ${fmt(a)}`),
  ];
  const textLines = texts(markup, scripts).slice(0, 80);
  let out;
  if (onlyText) out = textLines;
  else if (rawValues) out = valueLines;
  else {
    out = [
      `# ${title ?? "(sin título)"}${size ? ` — artboard ${size[1]}×${size[2]}` : ""}`,
      "## estructura",
      ...outline(markup),
      "## valores",
      ...valueLines,
      "## textos",
      ...textLines.map((t) => `- ${t}`),
      "## estados/variantes",
      states(html).join(" ") || "(ninguno)",
    ];
  }
  return maxLines ? out.slice(0, maxLines).join("\n") : out.join("\n");
}
