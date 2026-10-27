import { readFileSync, renameSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { withClient } from "./db.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: pnpm db:apply supabase/migrations/<version>_<name>.sql");
  process.exit(2);
}
const name = basename(file).replace(/^\d+_/, "").replace(/\.sql$/, "");
const version = new Date().toISOString().replace(/\D/g, "").slice(0, 14);

await withClient(async (client) => {
  await client.query("begin");
  try {
    await client.query(readFileSync(file, "utf8"));
    await client.query(
      "insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)",
      [version, name, [readFileSync(file, "utf8")]],
    );
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    console.error(`FAIL: ${e.message}`);
    process.exit(1);
  }
});
const target = join(dirname(file), `${version}_${name}.sql`);
if (target !== file) renameSync(file, target);
console.log(`applied ${version}_${name}`);
