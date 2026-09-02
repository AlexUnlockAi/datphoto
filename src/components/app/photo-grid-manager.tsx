"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { publicStorageUrl } from "@/lib/storage";
import { deletePhoto, reassignPhotoStudent } from "@/app/(dashboard)/shoots/[id]/gallery/actions";
import type { Photo, Student } from "@/lib/types";

const UNASSIGNED = "__unassigned__";

export function PhotoGridManager({
  photos,
  students,
}: {
  photos: Photo[];
  students: Student[];
}) {
  const [pending, startTransition] = useTransition();

  function remove(photoId: string) {
    if (!window.confirm("Delete this photo? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deletePhoto(photoId);
      if (result.error) toast.error(result.error);
      else toast.success("Photo deleted.");
    });
  }

  function reassign(photoId: string, studentId: string) {
    startTransition(async () => {
      const result = await reassignPhotoStudent(
        photoId,
        studentId === UNASSIGNED ? null : studentId
      );
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {photos.map((photo) => (
        <div key={photo.id} className="group/photo space-y-1.5">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicStorageUrl("photos-preview", photo.preview_path)}
              alt={photo.original_filename ?? "Photo"}
              className="size-full object-cover"
            />
            <button
              onClick={() => remove(photo.id)}
              disabled={pending}
              aria-label="Delete photo"
              className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/photo:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <Select
            value={photo.student_id ?? UNASSIGNED}
            onValueChange={(v) => reassign(photo.id, v ?? UNASSIGNED)}
          >
            <SelectTrigger size="sm" className="w-full">
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
        </div>
      ))}
    </div>
  );
}
