// app/api/todos/[id]/route.ts
export const runtime = "nodejs";

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

  if (role !== "user") {
    return NextResponse.json({ message: "Forbidden: cannot update todos" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const db = await getDb();

  const existingRes = await db.query(`SELECT * FROM todos WHERE id = $1`, [id]);
  const existing = existingRes.rows[0] as any;
  if (!existing) return NextResponse.json({ message: "Todo not found" }, { status: 404 });

  if (existing.ownerId !== userId) {
    return NextResponse.json({ message: "Forbidden: not your todo" }, { status: 403 });
  }

  let body: UpdateTodoInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

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
    if (!isValidStatus(body.status)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
  }

  // Always refresh updatedAt
  updates.updatedAt = new Date().toISOString();

  // Build dynamic UPDATE with $ params
  const keys = Object.keys(updates);
  const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
  const values = keys.map((k) => updates[k]);
  values.push(id);

  const updatedRes = await db.query(
    `UPDATE todos SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );

  const updated = updatedRes.rows[0] as any;

  const ownerName =
    updated.ownerId === userId
      ? ((session.user.name ?? null) as string | null)
      : (await resolveUserNamesByIds(db, [updated.ownerId]))[updated.ownerId] ?? null;

  return NextResponse.json({
    ...updated,
    ownerName,
    createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
    updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt),
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  const { id } = await ctx.params;
  const db = await getDb();

  const existingRes = await db.query(`SELECT * FROM todos WHERE id = $1`, [id]);
  const existing = existingRes.rows[0] as any;
  if (!existing) return NextResponse.json({ message: "Todo not found" }, { status: 404 });

  if (role === "admin") {
    await db.query(`DELETE FROM todos WHERE id = $1`, [id]);
    return NextResponse.json({ message: "Deleted" });
  }

  if (role === "manager") {
    return NextResponse.json({ message: "Forbidden: cannot delete todos" }, { status: 403 });
  }

  if (existing.ownerId !== userId) {
    return NextResponse.json({ message: "Forbidden: not your todo" }, { status: 403 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json({ message: "Forbidden: can only delete draft todos" }, { status: 403 });
  }

  await db.query(`DELETE FROM todos WHERE id = $1`, [id]);
  return NextResponse.json({ message: "Deleted" });
}
