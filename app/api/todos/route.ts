// app/api/todos/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, resolveUserNamesByIds } from "@/lib/db";
import type { CreateTodoInput, TodoStatus } from "@/lib/todos.types";

const STATUSES: TodoStatus[] = ["draft", "in_progress", "completed"];
function isValidStatus(s: unknown): s is TodoStatus {
  return STATUSES.includes(s as TodoStatus);
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  const db = await getDb();

  const result =
    role === "user"
      ? await db.query(`SELECT * FROM todos WHERE "ownerId" = $1 ORDER BY "updatedAt" DESC`, [userId])
      : await db.query(`SELECT * FROM todos ORDER BY "updatedAt" DESC`);

  const rows = result.rows;

  const ownerIds = rows.map((r) => String(r.ownerId));
  const nameMap = await resolveUserNamesByIds(db, ownerIds);

  const withOwnerName = rows.map((t: any) => ({
    ...t,
    ownerName: nameMap[t.ownerId] ?? null,
    // normalize timestamptz to string
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
  }));

  return NextResponse.json(withOwnerName);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  const userId = session.user.id;

  if (role !== "user") {
    return NextResponse.json({ message: "Forbidden: cannot create todos" }, { status: 403 });
  }

  let body: CreateTodoInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ message: "Title cannot be empty" }, { status: 400 });

  const description = typeof body.description === "string" ? body.description.trim() : null;

  const status = body.status ?? "draft";
  if (!isValidStatus(status)) return NextResponse.json({ message: "Invalid status" }, { status: 400 });

  const db = await getDb();

  const id = crypto.randomUUID();

  const inserted = await db.query(
    `
    INSERT INTO todos (id, title, description, status, "ownerId")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,
    [id, title, description, status, userId]
  );

  const created = inserted.rows[0] as any;
  const ownerName = (session.user.name ?? null) as string | null;

  return NextResponse.json(
    {
      ...created,
      ownerName,
      createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt),
      updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt),
    },
    { status: 201 }
  );
}
