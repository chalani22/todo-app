// lib/todos.types.ts
export type TodoStatus = "draft" | "in_progress" | "completed";

export type Todo = {
  id: string;
  title: string;
  description?: string | null;
  status: TodoStatus;

  // User id who created the todo
  ownerId: string;

  // Optional display name (returned by API for manager/admin views)
  ownerName?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type CreateTodoInput = {
  title: string;
  description?: string | null;
  status: TodoStatus;
};

export type UpdateTodoInput = {
  title?: string;
  description?: string;
  status?: TodoStatus;
};
