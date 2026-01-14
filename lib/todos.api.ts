// lib/todos.api.ts
import type { CreateTodoInput, Todo, TodoStatus, UpdateTodoInput } from "@/lib/todos.types";

// Shared JSON request helper (includes cookies for Better Auth session)
async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    // Try to surface backend { message } errors
    let msg = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      msg = json?.message || msg;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export function listTodos() {
  return req<Todo[]>("/api/todos");
}

export function createTodo(input: CreateTodoInput) {
  return req<Todo>("/api/todos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTodo(id: string, input: UpdateTodoInput) {
  return req<Todo>(`/api/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTodo(id: string) {
  return req<{ message: string }>(`/api/todos/${id}`, {
    method: "DELETE",
  });
}

export const STATUSES: TodoStatus[] = ["draft", "in_progress", "completed"];
