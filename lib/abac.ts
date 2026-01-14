// lib/abac.ts
import type { TodoStatus } from "@/lib/todos.types";
import type { Role } from "@/lib/auth";

// List access: users see own (API filters), manager/admin see all
export function canListTodos(role: Role) {
  return role === "user" || role === "manager" || role === "admin";
}

// Create access: only "user"
export function canCreateTodo(role: Role) {
  return role === "user";
}

// Update access: only "user" and only for own todos
export function canUpdateTodo(role: Role, ownerId: string, userId: string) {
  return role === "user" && ownerId === userId;
}

// Delete access:
// - admin: any todo
// - manager: never
// - user: only own + status = "draft"
export function canDeleteTodo(role: Role, todoOwnerId: string, userId: string, status: TodoStatus) {
  if (role === "admin") return true;
  if (role === "manager") return false;
  return todoOwnerId === userId && status === "draft";
}
