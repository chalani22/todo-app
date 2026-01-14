// components/todos/types.ts
import type { Todo, TodoStatus } from "@/lib/todos.types";

export type Role = "user" | "manager" | "admin";

export const STATUS_LABEL: Record<TodoStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

// Dashboard access: all roles can open /todos (data visibility is enforced by the API)
export function canView(role: Role) {
  return role === "user" || role === "manager" || role === "admin";
}

// Only users can create todos
export function canCreate(role: Role) {
  return role === "user";
}

// Only users can edit their own todos
export function canEdit(role: Role, todo: Todo, currentUserId: string) {
  return role === "user" && todo.ownerId === currentUserId;
}

// Admin: delete any | Manager: never | User: own + draft only
export function canDelete(role: Role, todo: Todo, currentUserId: string) {
  if (role === "admin") return true;
  if (role === "manager") return false;
  return todo.ownerId === currentUserId && todo.status === "draft";
}

export function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function shortId(id: string) {
  if (!id) return "—";
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

// Owner label for UI:
// - "You" for current user's todos
// - ownerName when available
// - fallback to shortened ownerId
export function ownerLabel(ownerId: string, currentUserId: string, ownerName?: string | null) {
  if (!ownerId) return "—";
  if (ownerId === currentUserId) return "You";
  const nm = (ownerName ?? "").trim();
  if (nm) return nm;
  return shortId(ownerId);
}
