import { readFileSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^["']|["']$/g, "")]),
);

function parseUrl(url) {
  const [, creds, rest] = /^postgres(?:ql)?:\/\/(.*)@([^@]*)$/.exec(url);
  const i = creds.indexOf(":");
  const [hostPort, database] = rest.split("/");
  const [host, port] = hostPort.split(":");
  return { user: creds.slice(0, i), password: decodeURIComponent(creds.slice(i + 1).replace(/%(?![0-9a-fA-F]{2})/g, "%25")), host, port: Number(port), database };
}

export async function withClient(fn) {
  const client = new pg.Client({ ...parseUrl(env.DATABASE_URL), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
