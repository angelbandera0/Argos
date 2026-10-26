import { readFileSync, readdirSync } from "node:fs";
import { withClient } from "./db.mjs";

const dir = "supabase/tests";
const arg = process.argv[2];
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".test.sql") && (!arg || f.startsWith(arg)))
  .sort();
if (!files.length) {
  console.error(`No test matches "${arg ?? ""}"`);
  process.exit(2);
}

const helpers = readFileSync(`${dir}/000_helpers.sql`, "utf8");
const wrap = (sql) =>
  sql
    .replace(/^select (plan|ok|is|matches|throws_ok|lives_ok)\(/gm, "insert into tap (line) select $1(")
    .replace(/^select \* from finish\(\);/m, "insert into tap (line) select * from finish();");

let failed = false;
await withClient(async (client) => {
  for (const f of files) {
    const sql = `${helpers}
create temp table tap (n int generated always as identity, line text); grant all on tap to public;
${wrap(readFileSync(`${dir}/${f}`, "utf8"))}
select string_agg(line, E'\\n' order by n) as tap from tap;`;
    let tap;
    try {
      await client.query("begin");
      const results = await client.query(sql);
      tap = (Array.isArray(results) ? results.at(-1) : results).rows[0].tap;
    } catch (e) {
      tap = `error: ${e.message}`;
    } finally {
      await client.query("rollback");
    }
    const lines = tap.split("\n");
    const bad = lines.filter((l) => /^(not ok|#|error)/.test(l));
    const total = lines[0];
    if (bad.length) failed = true;
    console.log(`${f}: ${bad.length ? "FAIL" : "ok"} (${total})`);
    bad.forEach((l) => console.log(`  ${l}`));
  }
});
process.exit(failed ? 1 : 0);
