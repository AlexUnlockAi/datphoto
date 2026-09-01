"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Student } from "@/lib/types";

const UNASSIGNED = "__unassigned__";
const CONCURRENCY = 3;

type FileRow = {
  file: File;
  studentId: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

function matchStudentByFilename(filename: string, students: Student[]): Student | undefined {
  const match = filename.match(/^0*(\d+)/);
  if (!match) return undefined;
  const number = Number.parseInt(match[1], 10);
  return students.find((s) => s.shoot_number === number);
}

export function GalleryUploadClient({
  shootId,
  students,
}: {
  shootId: string;
  students: Student[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<FileRow[]>([]);
  const [uploading, setUploading] = useState(false);

  function handleFiles(fileList: FileList) {
    const newRows: FileRow[] = Array.from(fileList).map((file) => {
      const matched = matchStudentByFilename(file.name, students);
      return { file, studentId: matched?.id ?? UNASSIGNED, status: "pending" };
    });
    setRows(newRows);
  }

  function updateRow(i: number, patch: Partial<FileRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function uploadOne(i: number) {
    const row = rows[i];
    updateRow(i, { status: "uploading" });

    const formData = new FormData();
    formData.append("file", row.file);
    formData.append("shootId", shootId);
    if (row.studentId !== UNASSIGNED) formData.append("studentId", row.studentId);

    try {
      const res = await fetch("/api/photos/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        updateRow(i, { status: "error", error: body.error ?? "Upload failed" });
        return;
      }
      updateRow(i, { status: "done" });
    } catch {
      updateRow(i, { status: "error", error: "Network error" });
    }
  }

  async function handleUploadAll() {
    setUploading(true);
    const pending = rows.map((_, i) => i).filter((i) => rows[i].status !== "done");

    let cursor = 0;
    async function worker() {
      while (cursor < pending.length) {
        const i = pending[cursor];
        cursor += 1;
        await uploadOne(i);
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setUploading(false);
    const failed = rows.filter((r) => r.status === "error").length;
    if (failed > 0) {
      toast.error(`${failed} photo(s) failed to upload — you can retry those.`);
    } else {
      toast.success("All photos uploaded.");
    }
    router.refresh();
  }

  const unmatchedCount = rows.filter((r) => r.studentId === UNASSIGNED).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-14">
          <label
            htmlFor="photo-files"
            className="flex cursor-pointer flex-col items-center gap-3 border-2 border-dashed border-border py-10 text-center transition-colors hover:border-primary hover:bg-accent/40"
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Click to choose photos</p>
              <p className="text-sm text-muted-foreground">
                Name files with the shoot number (e.g. 042.jpg) to auto-match students.
              </p>
            </div>
          </label>
          <input
            id="photo-files"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{rows.length} photos selected</CardTitle>
            <CardDescription>
              {unmatchedCount > 0
                ? `${unmatchedCount} unmatched — assign a student or leave unassigned.`
                : "All matched to a student."}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[28rem] space-y-2 overflow-y-auto">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-3 border border-border p-2">
                <span className="flex-1 truncate text-sm">{row.file.name}</span>
                <Select
                  value={row.studentId}
                  onValueChange={(v) => updateRow(i, { studentId: v ?? UNASSIGNED })}
                >
                  <SelectTrigger size="sm" className="w-48">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        #{s.shoot_number} {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-6 shrink-0">
                  {row.status === "uploading" && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                  {row.status === "done" && <Check className="size-4 text-emerald-400" />}
                  {row.status === "error" && (
                    <X className="size-4 text-red-400" aria-label={row.error} />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleUploadAll} disabled={uploading}>
            {uploading && <Loader2 className="size-4 animate-spin" />}
            Upload {rows.filter((r) => r.status !== "done").length} photos
          </Button>
        </div>
      )}
    </div>
  );
}
