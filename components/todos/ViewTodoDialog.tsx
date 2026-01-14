// components/todos/ViewTodoDialog.tsx
"use client";

import type { Todo, TodoStatus } from "@/lib/todos.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fmtDate, ownerLabel } from "./types";

const STATUS_META: Record<TodoStatus, { label: string; dot: string; text: string; pill: string }> = {
  draft: {
    label: "Draft",
    dot: "bg-slate-400",
    text: "text-slate-700",
    pill: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-blue-500",
    text: "text-blue-700",
    pill: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  completed: {
    label: "Completed",
    dot: "bg-green-500",
    text: "text-green-700",
    pill: "bg-green-100 text-green-700 border border-green-200",
  },
};

function StatusPill({ value }: { value: TodoStatus }) {
  const meta = STATUS_META[value];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.pill}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function ViewTodoDialog({
  open,
  onOpenChange,
  todo,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  todo: Todo | null;
  currentUserId: string;
}) {
  // Title tooltip includes "name • id" when available
  const ownerTitle = todo?.ownerName ? `${todo.ownerName} • ${todo.ownerId}` : todo?.ownerId ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Todo details</DialogTitle>
          <DialogDescription>Read-only view.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Title */}
          <div className="grid grid-cols-12 items-center gap-3">
            <span className="col-span-4 text-muted-foreground">Title</span>
            <span className="col-span-8 text-right font-medium">{todo?.title ?? "—"}</span>
          </div>

          {/* Description */}
          <div className="grid grid-cols-12 items-start gap-3">
            <span className="col-span-4 text-muted-foreground">Description</span>
            <span className="col-span-8 text-right text-muted-foreground">
              {todo?.description?.trim() ? (
                <span className="inline-block max-w-[420px] text-right break-words">{todo.description}</span>
              ) : (
                "—"
              )}
            </span>
          </div>

          {/* Status */}
          <div className="grid grid-cols-12 items-center gap-3">
            <span className="col-span-4 text-muted-foreground">Status</span>
            <span className="col-span-8 flex justify-end">
              {todo ? <StatusPill value={todo.status} /> : <span className="text-muted-foreground">—</span>}
            </span>
          </div>

          {/* Owner */}
          <div className="grid grid-cols-12 items-center gap-3">
            <span className="col-span-4 text-muted-foreground">Owner</span>
            <span className="col-span-8 text-right" title={ownerTitle}>
              {todo ? (
                <span className="inline-flex items-center justify-end gap-2">
                  <span className="font-medium">{ownerLabel(todo.ownerId, currentUserId, todo.ownerName)}</span>
                  {todo.ownerId === currentUserId ? <span className="text-xs text-muted-foreground">(you)</span> : null}
                </span>
              ) : (
                "—"
              )}
            </span>
          </div>

          <Separator />

          {/* Created / Updated */}
          <div className="grid grid-cols-12 items-center gap-3">
            <span className="col-span-4 text-muted-foreground">Created</span>
            <span className="col-span-8 text-right">{fmtDate(todo?.createdAt)}</span>
          </div>

          <div className="grid grid-cols-12 items-center gap-3">
            <span className="col-span-4 text-muted-foreground">Updated</span>
            <span className="col-span-8 text-right">{fmtDate(todo?.updatedAt)}</span>
          </div>
        </div>

        <DialogFooter className="sm:space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
