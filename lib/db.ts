// lib/db.ts
import Database from "better-sqlite3";
import { TODOS_SCHEMA_SQL } from "@/lib/todos.schema";

type DB = InstanceType<typeof Database>;

let _db: DB | null = null;

// Cached user table info (detected once per process)
let _userTableInfo: { table: string; nameCol: string } | null | undefined = undefined;

// Local dev: keep using ./sqlite.db in project root.
function getSqlitePath() {
  if (process.env.VERCEL) return "/tmp/sqlite.db";
  return "./sqlite.db";
}

// Quote identifiers safely for SQLite (table/column names)
function qIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

// Best-effort detection of the Better Auth user table + its name column
function detectUserTable(db: DB): { table: string; nameCol: string } | null {
  const tables = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
    .all() as Array<{ name: string }>;

  const nameCandidates = ["name", "displayName", "fullName", "username"];

  for (const t of tables) {
    let cols: Array<{ name: string }> = [];
    try {
      cols = db.prepare(`PRAGMA table_info(${qIdent(t.name)})`).all() as any;
    } catch {
      continue;
    }

    const colNames = cols.map((c) => String(c.name));
    const lower = new Set(colNames.map((c) => c.toLowerCase()));

    // Require "id" column so we can map by user id
    if (!lower.has("id")) continue;

    // Find a name-like column
    const foundName = nameCandidates.find((cand) => lower.has(cand.toLowerCase()));
    if (!foundName) continue;

    return { table: t.name, nameCol: foundName };
  }

  return null;
}

// Maps userId -> name by querying the detected user table
export function resolveUserNamesByIds(db: DB, userIds: string[]): Record<string, string | null> {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return {};

  // Detect the user table only once (per server process)
  if (_userTableInfo === undefined) {
    _userTableInfo = detectUserTable(db);
  }
  if (_userTableInfo === null) return {};

  const { table, nameCol } = _userTableInfo;

  const placeholders = ids.map(() => "?").join(", ");
  const sql = `SELECT id, ${qIdent(nameCol)} as name FROM ${qIdent(table)} WHERE id IN (${placeholders})`;

  try {
    const rows = db.prepare(sql).all(...ids) as Array<{ id: string; name: string | null }>;
    const map: Record<string, string | null> = {};
    for (const r of rows) map[r.id] = r.name ?? null;
    return map;
  } catch {
    return {};
  }
}

// Lazy singleton connection + schema initialization
export function getDb() {
  if (!_db) {
    _db = new Database(getSqlitePath());
    _db.pragma("journal_mode = WAL");
    _db.exec(TODOS_SCHEMA_SQL);
  }
  return _db;
}
