import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GalleryUploadClient } from "@/components/app/gallery-upload-client";
import { publicStorageUrl } from "@/lib/storage";
import type { Photo, Shoot, Student } from "@/lib/types";

export default async function ShootGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [shootRes, studentsRes, photosRes] = await Promise.all([
    supabase.from("shoots").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("students")
      .select("*")
      .eq("shoot_id", id)
      .order("shoot_number", { ascending: true }),
    supabase
      .from("photos")
      .select("*")
      .eq("shoot_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const shoot = shootRes.data as Shoot | null;
  if (!shoot) notFound();

  const students = (studentsRes.data ?? []) as Student[];
  const photos = (photosRes.data ?? []) as Photo[];
  const studentsById = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl">Gallery — {shoot.school_name}</h1>
        <p className="text-sm text-muted-foreground">
          Photos are watermarked automatically on upload. Full-resolution downloads unlock
          per subject once their invoice is paid.
        </p>
      </div>

      <GalleryUploadClient shootId={shoot.id} students={students} />

      {photos.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg">{photos.length} uploaded</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {photos.map((photo) => {
              const student = photo.student_id ? studentsById.get(photo.student_id) : null;
              return (
                <div key={photo.id} className="space-y-1">
                  <div className="aspect-square overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={publicStorageUrl("photos-preview", photo.preview_path)}
                      alt={student ? student.full_name : photo.original_filename ?? "Photo"}
                      className="size-full object-cover"
                    />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {student ? `#${student.shoot_number} ${student.full_name}` : "Unassigned"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
