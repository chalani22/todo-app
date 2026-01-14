// app/api/todos/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, resolveUserNamesByIds } from "@/lib/db";
import type { CreateTodoInput, TodoStatus } from "@/lib/todos.types";

const STATUSES: TodoStatus[] = ["draft", "in_progress", "completed"];
function isValidStatus(s: unknown): s is TodoStatus {
  return STATUSES.includes(s as TodoStatus);
}

function nowIso() {
  return new Date().toISOString();
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  const db = getDb();

  // User: only own todos | Manager/Admin: all todos
  const rows =
    role === "user"
      ? (db.prepare(`SELECT * FROM todos WHERE ownerId = ? ORDER BY updatedAt DESC`).all(userId) as any[])
      : (db.prepare(`SELECT * FROM todos ORDER BY updatedAt DESC`).all() as any[]);

  // Add ownerName for UI display (especially useful for manager/admin)
  const ownerIds = rows.map((r) => String(r.ownerId));
  const nameMap = resolveUserNamesByIds(db, ownerIds);

  const withOwnerName = rows.map((t) => ({
    ...t,
    ownerName: nameMap[t.ownerId] ?? null,
  }));

  return NextResponse.json(withOwnerName);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  // Only "user" can create todos
  if (role !== "user") {
    return NextResponse.json({ message: "Forbidden: cannot create todos" }, { status: 403 });
  }

  let body: CreateTodoInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // Basic input validation
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ message: "Title cannot be empty" }, { status: 400 });

  const description = typeof body.description === "string" ? body.description.trim() : null;

  const status = body.status ?? "draft";
  if (!isValidStatus(status)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });

  const db = getDb();

  const id = crypto.randomUUID();
  const createdAt = nowIso();

  db.prepare(
    `INSERT INTO todos (id, title, description, status, ownerId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, title, description, status, userId, createdAt, createdAt);

  const created = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(id) as any;

  // Creator name comes from session (role is not client-controlled)
  const ownerName = (session.user.name ?? null) as string | null;

  return NextResponse.json({ ...created, ownerName }, { status: 201 });
}
