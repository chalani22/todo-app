// app/api/todos/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, resolveUserNamesByIds } from "@/lib/db";
import type { TodoStatus, UpdateTodoInput } from "@/lib/todos.types";

const STATUSES: TodoStatus[] = ["draft", "in_progress", "completed"];
function isValidStatus(s: unknown): s is TodoStatus {
  return STATUSES.includes(s as TodoStatus);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  // Only "user" can update todos (manager/admin are read-only for updates)
  if (role !== "user") {
    return NextResponse.json({ message: "Forbidden: cannot update todos" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const db = getDb();

  const existing = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(id) as any;
  if (!existing) return NextResponse.json({ message: "Todo not found" }, { status: 404 });

  // A user can only update their own todos
  if (existing.ownerId !== userId) {
    return NextResponse.json({ message: "Forbidden: not your todo" }, { status: 403 });
  }

  let body: UpdateTodoInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  // Collect only valid updates (ignore unknown fields)
  const updates: Record<string, any> = {};

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ message: "Title cannot be empty" }, { status: 400 });
    updates.title = t;
  }

  if (typeof body.description === "string") {
    updates.description = body.description.trim();
  }

  if (body.status !== undefined) {
    if (!isValidStatus(body.status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
  }

  // Always refresh updatedAt when a record changes
  updates.updatedAt = new Date().toISOString();

  // Build SET clause from approved keys
  const setClause = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");

  const values = [...Object.values(updates), id];
  db.prepare(`UPDATE todos SET ${setClause} WHERE id = ?`).run(...values);

  const updated = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(id) as any;

  // Attach ownerName for UI display (manager/admin lists also use this shape)
  const ownerName =
    updated.ownerId === userId
      ? ((session.user.name ?? null) as string | null)
      : resolveUserNamesByIds(db, [updated.ownerId])[updated.ownerId] ?? null;

  return NextResponse.json({ ...updated, ownerName });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  const { id } = await ctx.params;
  const db = getDb();

  const existing = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(id) as any;
  if (!existing) return NextResponse.json({ message: "Todo not found" }, { status: 404 });

  // Admin can delete any todo (any status)
  if (role === "admin") {
    db.prepare(`DELETE FROM todos WHERE id = ?`).run(id);
    return NextResponse.json({ message: "Deleted" });
  }

  // Manager cannot delete
  if (role === "manager") {
    return NextResponse.json({ message: "Forbidden: cannot delete todos" }, { status: 403 });
  }

  // User can delete only their own todos, and only when status = "draft"
  if (existing.ownerId !== userId) {
    return NextResponse.json({ message: "Forbidden: not your todo" }, { status: 403 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json({ message: "Forbidden: can only delete draft todos" }, { status: 403 });
  }

  db.prepare(`DELETE FROM todos WHERE id = ?`).run(id);
  return NextResponse.json({ message: "Deleted" });
}
