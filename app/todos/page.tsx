// app/todos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/hooks/useSession";
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from "@/hooks/useTodos";
import type { Todo, TodoStatus } from "@/lib/todos.types";
import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { CheckCircle2, Edit3, Eye, LogOut, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";

import { Role, STATUS_LABEL, canCreate, canDelete, canEdit, canView, fmtDate, ownerLabel } from "@/components/todos/types";

import { CreateTodoDialog } from "@/components/todos/CreateTodoDialog";
import { EditTodoDialog } from "@/components/todos/EditTodoDialog";
import { ViewTodoDialog } from "@/components/todos/ViewTodoDialog";
import { DeleteTodoDialog } from "@/components/todos/DeleteTodoDialog";

type SortKey = "updated_desc" | "updated_asc" | "created_desc" | "created_asc";

const CARD_CLASS =
  "border border-blue-200/70 dark:border-blue-900/70 shadow-xl shadow-blue-500/10 bg-white/70 dark:bg-background/70 backdrop-blur";

export default function TodosPage() {
  const router = useRouter();
  const qc = useQueryClient();

  // Queries
  const sessionQ = useSession();
  const todosQ = useTodos();

  // Mutations
  const createMut = useCreateTodo();
  const updateMut = useUpdateTodo();
  const deleteMut = useDeleteTodo();

  // Session-derived values (defaults keep UI stable while loading)
  const session = sessionQ.data;
  const role = (session?.user?.role ?? "user") as Role;
  const userId = session?.user?.id ?? "";
  const userName = session?.user?.name ?? "User";

  // If not signed in, redirect to sign-in page
  useEffect(() => {
    if (sessionQ.isLoading) return;
    if (!session) router.push("/sign-in");
  }, [sessionQ.isLoading, session, router]);

  // Filters / sorting
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | TodoStatus>("all");
  const [sort, setSort] = useState<SortKey>("updated_desc");

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

  // Create form state
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cStatus, setCStatus] = useState<TodoStatus>("draft");

  // Edit form state
  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eStatus, setEStatus] = useState<TodoStatus>("draft");

  const todos = useMemo(() => todosQ.data ?? [], [todosQ.data]);

  // Summary counts for stat cards
  const stats = useMemo(() => {
    const total = todos.length;
    const draft = todos.filter((t) => t.status === "draft").length;
    const inProgress = todos.filter((t) => t.status === "in_progress").length;
    const completed = todos.filter((t) => t.status === "completed").length;
    return { total, draft, inProgress, completed };
  }, [todos]);

  // Apply tab filter, search, then sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = todos;

    if (tab !== "all") list = list.filter((t) => t.status === tab);

    if (q) {
      list = list.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description ?? "").toLowerCase().includes(q);

        // Owner search applies only when role can view cross-user data
        const ownerNameMatch = (t.ownerName ?? "").toLowerCase().includes(q);
        const ownerIdMatch = t.ownerId.toLowerCase().includes(q);
        const ownerMatch = canView(role) ? ownerNameMatch || ownerIdMatch : false;

        return titleMatch || descMatch || ownerMatch;
      });
    }

    // ISO timestamps are stored; this parser keeps existing behavior
    const parse = (s?: string) => new Date((s ?? "").replace(" ", "T") + "Z").getTime();
    const byUpdated = (a: Todo, b: Todo) => parse(a.updatedAt) - parse(b.updatedAt);
    const byCreated = (a: Todo, b: Todo) => parse(a.createdAt) - parse(b.createdAt);

    if (sort === "updated_desc") list = [...list].sort((a, b) => byUpdated(b, a));
    if (sort === "updated_asc") list = [...list].sort(byUpdated);
    if (sort === "created_desc") list = [...list].sort((a, b) => byCreated(b, a));
    if (sort === "created_asc") list = [...list].sort(byCreated);

    return list;
  }, [todos, query, tab, sort, role]);

  const doSignOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      // Clear cached session/todos so UI resets cleanly
      qc.removeQueries({ queryKey: ["session"] });
      qc.removeQueries({ queryKey: ["todos"] as any });
      router.push("/sign-in");
    }
  };

  const openEdit = (t: Todo) => {
    setActiveTodo(t);
    setETitle(t.title);
    setEDesc(t.description ?? "");
    setEStatus(t.status);
    setEditOpen(true);
  };

  const openView = (t: Todo) => {
    setActiveTodo(t);
    setViewOpen(true);
  };

  const openDelete = (t: Todo) => {
    setActiveTodo(t);
    setDeleteOpen(true);
  };

  const doCreate = async () => {
    await createMut.mutateAsync({ title: cTitle.trim(), description: cDesc.trim(), status: cStatus });
    setCreateOpen(false);
    setCTitle("");
    setCDesc("");
    setCStatus("draft");
  };

  const doUpdate = async () => {
    if (!activeTodo) return;
    await updateMut.mutateAsync({
      id: activeTodo.id,
      input: { title: eTitle.trim(), description: eDesc.trim(), status: eStatus },
    });
    setEditOpen(false);
    setActiveTodo(null);
  };

  const doDelete = async () => {
    if (!activeTodo) return;
    await deleteMut.mutateAsync(activeTodo.id);
    setDeleteOpen(false);
    setActiveTodo(null);
  };

  // Initial skeleton while session is loading
  if (sessionQ.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!session) return <div className="p-6">Redirecting…</div>;

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-background">
      {/* Top nav */}
      <header className="border-b border-blue-200/60 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/80 via-white/60 to-indigo-50/80 dark:from-blue-950/20 dark:via-background/60 dark:to-indigo-950/20 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500 text-white p-2 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-none">Todo ABAC</p>
              <p className="text-xs text-muted-foreground">Role-aware task management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={role === "admin" ? "destructive" : role === "manager" ? "secondary" : "outline"}
              className="uppercase tracking-wide"
            >
              {role} role
            </Badge>

            <Separator orientation="vertical" className="h-6" />

            {/* Profile pill */}
            <div className="flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/70 px-2 py-1 shadow-sm shadow-blue-500/10 dark:border-blue-900/60 dark:bg-background/60">
              <Avatar className="h-9 w-9 ring-2 ring-blue-500/15">
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500 text-white">
                  {userName
                    .split(" ")
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-sm font-semibold max-w-[160px] truncate">{userName}</span>
                <span className="text-[11px] text-muted-foreground capitalize">{role}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={doSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-full"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Todos</h1>
            <p className="mt-1 text-muted-foreground">View and manage tasks.</p>
          </div>

          {/* Create is role-gated */}
          {canCreate(role) && (
            <Button
              className="h-11 px-5 rounded-full bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-500 text-white shadow-md"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Todo
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Todos" value={stats.total} tone="total" />
          <StatCard title="Draft" value={stats.draft} tone="draft" />
          <StatCard title="In Progress" value={stats.inProgress} tone="in_progress" />
          <StatCard title="Completed" value={stats.completed} tone="completed" />
        </div>

        {/* Filters */}
        <Card className={CARD_CLASS}>
          <CardContent className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-11 rounded-full"
                placeholder={canView(role) ? "Search..." : "Search tasks, descriptions…"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="rounded-full">
                  <TabsTrigger value="all" className="rounded-full">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="rounded-full">
                    Draft
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="rounded-full">
                    In Progress
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="rounded-full">
                    Completed
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-11 rounded-full w-[190px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">Sort by Updated (newest)</SelectItem>
                  <SelectItem value="updated_asc">Sort by Updated (oldest)</SelectItem>
                  <SelectItem value="created_desc">Sort by Created (newest)</SelectItem>
                  <SelectItem value="created_asc">Sort by Created (oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className={CARD_CLASS}>
          <CardContent className="p-0">
            {todosQ.isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : todosQ.isError ? (
              <div className="p-6 space-y-3">
                <p className="font-semibold text-red-600">Failed to load todos</p>
                <p className="text-sm text-muted-foreground">
                  {String((todosQ.error as any)?.message ?? "Unknown error")}
                </p>
                <Button variant="outline" onClick={() => todosQ.refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-blue-50/60 dark:bg-blue-950/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[280px] text-xs font-semibold tracking-wide text-muted-foreground">
                      TITLE
                    </TableHead>
                    <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground">
                      DESCRIPTION
                    </TableHead>
                    <TableHead className="w-[160px] text-xs font-semibold tracking-wide text-muted-foreground">
                      STATUS
                    </TableHead>
                    <TableHead className="w-[160px] text-xs font-semibold tracking-wide text-muted-foreground">
                      UPDATED
                    </TableHead>
                    {canView(role) && (
                      <TableHead className="w-[180px] text-xs font-semibold tracking-wide text-muted-foreground">
                        OWNER
                      </TableHead>
                    )}
                    <TableHead className="w-[140px] text-right text-xs font-semibold tracking-wide text-muted-foreground">
                      ACTIONS
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canView(role) ? 6 : 5} className="py-10 text-center">
                        <p className="font-medium">No todos found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((t) => {
                      const editable = canEdit(role, t, userId);
                      const deletable = canDelete(role, t, userId);

                      const ownerTitle = t.ownerName ? `${t.ownerName} • ${t.ownerId}` : t.ownerId;

                      return (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.title}</TableCell>

                          <TableCell className="text-muted-foreground">
                            <span className="line-clamp-1">{t.description || "—"}</span>
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={
                                t.status === "draft"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : t.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                              }
                            >
                              {STATUS_LABEL[t.status]}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-muted-foreground">{fmtDate(t.updatedAt)}</TableCell>

                          {canView(role) && (
                            <TableCell className="text-muted-foreground" title={ownerTitle}>
                              {ownerLabel(t.ownerId, userId, t.ownerName)}
                            </TableCell>
                          )}

                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2">
                              {/* View is only for manager/admin */}
                              {canView(role) && (
                                <IconButton
                                  title="View"
                                  onClick={() => openView(t)}
                                  icon={<Eye className="h-4 w-4" />}
                                />
                              )}

                              {editable && (
                                <IconButton
                                  title="Edit"
                                  onClick={() => openEdit(t)}
                                  icon={<Edit3 className="h-4 w-4" />}
                                />
                              )}

                              {/* For users, delete is allowed only when status = Draft */}
                              {deletable ? (
                                <IconButton
                                  title="Delete"
                                  onClick={() => openDelete(t)}
                                  icon={<Trash2 className="h-4 w-4 text-red-600" />}
                                />
                              ) : role === "user" && t.ownerId === userId ? (
                                <IconButton
                                  disabled
                                  title="Delete allowed only when status = Draft"
                                  icon={<Trash2 className="h-4 w-4 text-muted-foreground" />}
                                />
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <CreateTodoDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={cTitle}
        setTitle={setCTitle}
        description={cDesc}
        setDescription={setCDesc}
        status={cStatus}
        setStatus={setCStatus}
        onCreate={doCreate}
        isPending={createMut.isPending}
        errorMessage={createMut.isError ? String(createMut.error.message) : null}
      />

      <EditTodoDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={eTitle}
        setTitle={setETitle}
        description={eDesc}
        setDescription={setEDesc}
        status={eStatus}
        setStatus={setEStatus}
        onSave={doUpdate}
        isPending={updateMut.isPending}
        errorMessage={updateMut.isError ? String(updateMut.error.message) : null}
      />

      <ViewTodoDialog open={viewOpen} onOpenChange={setViewOpen} todo={activeTodo} currentUserId={userId} />

      <DeleteTodoDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        todo={activeTodo}
        onDelete={doDelete}
        isPending={deleteMut.isPending}
        errorMessage={deleteMut.isError ? String(deleteMut.error.message) : null}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "total" | "draft" | "in_progress" | "completed";
}) {
  const toneMeta =
    tone === "total"
      ? {
          ring: "ring-blue-500/10",
          border: "border-blue-200/70 dark:border-blue-900/70",
          accent: "from-blue-600/15 via-indigo-500/10 to-transparent",
          value: "text-blue-700 dark:text-blue-300",
          icon: "text-blue-600",
        }
      : tone === "draft"
      ? {
          ring: "ring-slate-500/10",
          border: "border-slate-200/70 dark:border-slate-800/70",
          accent: "from-slate-500/15 via-slate-400/10 to-transparent",
          value: "text-slate-700 dark:text-slate-200",
          icon: "text-slate-500",
        }
      : tone === "in_progress"
      ? {
          ring: "ring-blue-500/10",
          border: "border-blue-200/70 dark:border-blue-900/70",
          accent: "from-blue-600/15 via-cyan-500/10 to-transparent",
          value: "text-blue-700 dark:text-blue-300",
          icon: "text-blue-600",
        }
      : {
          ring: "ring-green-500/10",
          border: "border-green-200/70 dark:border-green-900/60",
          accent: "from-green-600/15 via-emerald-500/10 to-transparent",
          value: "text-green-700 dark:text-green-300",
          icon: "text-green-600",
        };

  return (
    <Card
      className={[
        "relative overflow-hidden",
        "border",
        toneMeta.border,
        "shadow-xl shadow-blue-500/10 bg-white/70 dark:bg-background/70 backdrop-blur",
        "ring-1",
        toneMeta.ring,
      ].join(" ")}
    >
      {/* Background accent */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneMeta.accent}`} />

      <CardContent className="relative p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-bold leading-none ${toneMeta.value}`}>{value}</p>
          </div>

          <div className={toneMeta.icon}>
            {tone === "completed" ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IconButton({
  icon,
  onClick,
  title,
  disabled,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
    </Button>
  );
}
