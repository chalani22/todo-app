// components/todos/DeleteTodoDialog.tsx
"use client";

import type { Todo } from "@/lib/todos.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";

export function DeleteTodoDialog({
  open,
  onOpenChange,
  todo,
  onDelete,
  isPending,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  todo: Todo | null;
  onDelete: () => Promise<void> | void;
  isPending: boolean;
  errorMessage?: string | null;
}) {
  // Display fallbacks (dialog can open before todo is set)
  const title = todo?.title ?? "—";
  const desc = todo?.description?.trim() ? todo.description : "No description";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Delete Todo?</DialogTitle>
          <DialogDescription>This action is permanent and cannot be undone.</DialogDescription>
        </DialogHeader>

        {/* Todo preview */}
        <div className="rounded-2xl border border-red-200/60 bg-red-50/30 p-4">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center h-10 w-10 rounded-full bg-red-100 text-red-700">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 space-y-1">
              <p className="font-semibold leading-none truncate">{title}</p>
              <p className="text-sm text-muted-foreground leading-snug line-clamp-2">{desc}</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {!!errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <DialogFooter className="sm:space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>

          <Button variant="destructive" onClick={onDelete} disabled={isPending} className="rounded-full">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete forever"
            )}
          </Button>
        </DialogFooter>

        {/* Footer note */}
        <div className="pt-4 border-t flex items-center justify-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-xs font-medium uppercase tracking-wider">Requires permission</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
