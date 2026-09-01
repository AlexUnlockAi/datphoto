"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, RotateCcw, UserX, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { setStudentStatus } from "@/app/(dashboard)/shoots/[id]/checkin/actions";
import type { Student, StudentStatus } from "@/lib/types";

export function CheckinList({
  shootId,
  initialStudents,
}: {
  shootId: string;
  initialStudents: Student[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        String(s.shoot_number).includes(q) ||
        s.grade_or_teacher?.toLowerCase().includes(q)
    );
  }, [students, query]);

  const done = students.filter((s) => s.status === "photographed").length;

  function updateLocal(id: string, status: StudentStatus) {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              photographed_at: status === "photographed" ? new Date().toISOString() : null,
            }
          : s
      )
    );
  }

  function toggle(student: Student, next: StudentStatus) {
    const resolved = student.status === next ? "pending" : next;
    const prevStatus = student.status;
    updateLocal(student.id, resolved);

    startTransition(async () => {
      const result = await setStudentStatus(shootId, student.id, resolved);
      if (result.error) {
        updateLocal(student.id, prevStatus);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-6 space-y-3 border-b border-border bg-background px-6 pb-4 pt-1 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between">
          <p className="font-heading text-2xl font-semibold">
            {done} <span className="text-muted-foreground">/ {students.length}</span>
          </p>
          <Badge variant="secondary">photographed</Badge>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or number…"
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex items-center gap-3 border border-border bg-card p-3",
              s.status === "photographed" && "border-emerald-500/40 bg-emerald-500/10",
              s.status === "no_show" && "border-red-500/40 bg-red-500/10",
              s.status === "redo" && "border-amber-500/40 bg-amber-500/10"
            )}
          >
            <span className="w-9 shrink-0 text-center font-heading text-sm font-semibold text-muted-foreground">
              {s.shoot_number}
            </span>

            <button
              type="button"
              onClick={() => toggle(s, "photographed")}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate font-medium">{s.full_name}</p>
              {s.grade_or_teacher && (
                <p className="truncate text-xs text-muted-foreground">
                  {s.grade_or_teacher}
                </p>
              )}
            </button>

            <button
              type="button"
              onClick={() => toggle(s, "photographed")}
              aria-label="Mark photographed"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                s.status === "photographed"
                  ? "border-emerald-500 bg-emerald-500 text-black"
                  : "border-border bg-background text-muted-foreground hover:border-emerald-500/60 hover:text-emerald-400"
              )}
            >
              <Check className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => toggle(s, "redo")}
              aria-label="Flag redo"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                s.status === "redo"
                  ? "border-amber-500 bg-amber-500 text-black"
                  : "border-border bg-background text-muted-foreground hover:border-amber-500/60 hover:text-amber-400"
              )}
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => toggle(s, "no_show")}
              aria-label="Mark no-show"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                s.status === "no_show"
                  ? "border-red-500 bg-red-500 text-black"
                  : "border-border bg-background text-muted-foreground hover:border-red-500/60 hover:text-red-400"
              )}
            >
              <UserX className="size-4" />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No students match &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
