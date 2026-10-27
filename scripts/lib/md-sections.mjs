export function parseHeadings(md) {
  const out = [];
  let fence = false;
  md.split("\n").forEach((l, i) => {
    if (/^\s*```/.test(l)) fence = !fence;
    const m = !fence && /^(#{1,6})\s+(.*?)\s*$/.exec(l);
    if (m) out.push({ level: m[1].length, title: m[2], line: i + 1 });
  });
  return out;
}

const num = (t) => /^(\d+(?:\.\d+)*)\.?(?:\s|$)/.exec(t)?.[1];

export function findSection(md, query) {
  const heads = parseHeadings(md);
  const q = query.trim().toLowerCase();
  const isNum = /^\d+(\.\d+)*\.?$/.test(q);
  const key = q.replace(/\.$/, "");
  const hits = heads.filter((h) => (isNum ? num(h.title) === key : h.title.toLowerCase().includes(q)));
  if (hits.length !== 1) return { hits };
  const h = hits[0];
  const lines = md.split("\n");
  const next = heads.find((x) => x.line > h.line && x.level <= h.level);
  const end = next ? next.line - 1 : lines.length;
  return { hits, text: lines.slice(h.line - 1, end).join("\n").trimEnd() };
}
