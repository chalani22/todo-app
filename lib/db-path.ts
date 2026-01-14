// lib/db-path.ts
export function getSqlitePath() {
  // Vercel runtime filesystem: only /tmp is writable
  if (process.env.VERCEL) return "/tmp/sqlite.db";
  return "./sqlite.db";
}
