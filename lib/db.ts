// lib/db.ts
import { Pool } from "pg";
import { TODOS_SCHEMA_SQL } from "@/lib/todos.schema";

let _pool: Pool | null = null;
let _schemaReady = false;

// Cached user table info (detected once per process)
let _userTableInfo: { table: string; nameCol: string } | null | undefined = undefined;

function getPool() {
  if (_pool) return _pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL (set it in .env.local and Vercel env vars)");

  // Neon requires SSL; connection string includes sslmode=require, but we enforce ssl anyway
  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  return _pool;
}

// Run todos DDL once per server process
async function ensureTodosSchema(pool: Pool) {
  if (_schemaReady) return;
  await pool.query(TODOS_SCHEMA_SQL);
  _schemaReady = true;
}

// Quote identifiers safely for Postgres (table/column names)
function qIdent(name: string) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

// Best-effort detection of Better Auth user table + name column in Postgres
async function detectUserTable(pool: Pool): Promise<{ table: string; nameCol: string } | null> {
  const nameCandidates = ["name", "displayName", "fullName", "username"];

  // Common Better Auth table name is "user" (reserved word, needs quoting)
  // We'll also try to detect generically via information_schema
  const tablesRes = await pool.query<{
    table_name: string;
  }>(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `
  );

  for (const row of tablesRes.rows) {
    const table = row.table_name;

    const colsRes = await pool.query<{ column_name: string }>(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `,
      [table]
    );

    const cols = colsRes.rows.map((r) => r.column_name);
    const lower = new Set(cols.map((c) => c.toLowerCase()));

    if (!lower.has("id")) continue;

    const foundName = nameCandidates.find((cand) => lower.has(cand.toLowerCase()));
    if (!foundName) continue;

    return { table, nameCol: foundName };
  }

  return null;
}

// Maps userId -> name by querying the detected user table
export async function resolveUserNamesByIds(
  pool: Pool,
  userIds: string[]
): Promise<Record<string, string | null>> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return {};

  if (_userTableInfo === undefined) {
    _userTableInfo = await detectUserTable(pool);
  }
  if (_userTableInfo === null) return {};

  const { table, nameCol } = _userTableInfo;

  // Use = ANY($1) for array parameter
  const sql = `SELECT id, ${qIdent(nameCol)} as name FROM ${qIdent(table)} WHERE id = ANY($1::text[])`;

  try {
    const rows = await pool.query<{ id: string; name: string | null }>(sql, [ids]);
    const map: Record<string, string | null> = {};
    for (const r of rows.rows) map[r.id] = r.name ?? null;
    return map;
  } catch {
    return {};
  }
}

// Public helper used by API routes
export async function getDb() {
  const pool = getPool();
  await ensureTodosSchema(pool);
  return pool;
}
