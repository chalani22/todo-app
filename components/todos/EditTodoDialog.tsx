// components/todos/EditTodoDialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { TodoStatus } from "@/lib/todos.types";

const STATUS_META: Record<TodoStatus, { label: string; dot: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-slate-400", text: "text-slate-700" },
  in_progress: { label: "In Progress", dot: "bg-blue-500", text: "text-blue-700" },
  completed: { label: "Completed", dot: "bg-green-500", text: "text-green-700" },
};

function StatusLabel({ value }: { value: TodoStatus }) {
  const meta = STATUS_META[value];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
      <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
    </span>
  );
}

export function EditTodoDialog({
  open,
  onOpenChange,
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  onSave,
  isPending,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;

  status: TodoStatus;
  setStatus: (v: TodoStatus) => void;

  onSave: () => Promise<void> | void;
  isPending: boolean;
  errorMessage?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogDescription>Update the title, description, or status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium">Status</label>

            <Select value={status} onValueChange={(v) => setStatus(v as TodoStatus)}>
              <SelectTrigger className="w-[220px]">
                <StatusLabel value={status} />
              </SelectTrigger>

              {/* High z-index so the dropdown opens correctly inside Dialog */}
              <SelectContent className="z-[200]" position="popper">
                <SelectItem value="draft">
                  <StatusLabel value="draft" />
                </SelectItem>
                <SelectItem value="in_progress">
                  <StatusLabel value="in_progress" />
                </SelectItem>
                <SelectItem value="completed">
                  <StatusLabel value="completed" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {!!errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>

        <DialogFooter className="sm:space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>

          <Button
            onClick={onSave}
            disabled={!title.trim() || isPending}
            className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
