// hooks/useTodos.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTodo, deleteTodo, listTodos, updateTodo } from "@/lib/todos.api";
import type { CreateTodoInput, UpdateTodoInput } from "@/lib/todos.types";

export const todosKey = ["todos"] as const;

export function useTodos() {
  return useQuery({
    queryKey: todosKey,
    queryFn: listTodos,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTodoInput) => createTodo(input),
    // Refresh list after creating
    onSuccess: () => qc.invalidateQueries({ queryKey: todosKey }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) => updateTodo(id, input),
    // Refresh list after updating
    onSuccess: () => qc.invalidateQueries({ queryKey: todosKey }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    // Refresh list after deleting
    onSuccess: () => qc.invalidateQueries({ queryKey: todosKey }),
  });
}
