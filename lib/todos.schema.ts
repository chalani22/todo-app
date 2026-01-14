export const TODOS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed')),
  ownerId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_todos_ownerId ON todos(ownerId);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_owner_status ON todos(ownerId, status);

CREATE TRIGGER IF NOT EXISTS trg_todos_updatedAt
AFTER UPDATE ON todos
FOR EACH ROW
BEGIN
  UPDATE todos
  SET updatedAt = datetime('now')
  WHERE id = NEW.id;
END;
`;
