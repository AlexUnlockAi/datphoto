import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GalleryUploadClient } from "@/components/app/gallery-upload-client";
import { PhotoGridManager } from "@/components/app/photo-grid-manager";
import { GalleryFolderManager } from "@/components/app/gallery-folder-manager";
import { createGalleryFolder } from "./actions";
import type { GalleryFolder, Photo, Shoot, Student } from "@/lib/types";

export default async function ShootGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [shootRes, studentsRes, photosRes, foldersRes] = await Promise.all([
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
    supabase.from("gallery_folders").select("*").eq("shoot_id", id).eq("is_active", true).order("created_at"),
  ]);

  const shoot = shootRes.data as Shoot | null;
  if (!shoot) notFound();

  const students = (studentsRes.data ?? []) as Student[];
  const photos = (photosRes.data ?? []) as Photo[];
  const folders = (foldersRes.data ?? []) as GalleryFolder[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl">Gallery — {shoot.school_name}</h1>
          <p className="text-sm text-muted-foreground">
            Photos are watermarked automatically on upload. Full-resolution downloads unlock
            once a client&rsquo;s order or invoice is paid.
          </p>
        </div>
      </div>

      <GalleryFolderManager shootId={shoot.id} folders={folders} createFolder={createGalleryFolder} />

      <GalleryUploadClient shootId={shoot.id} folderId={folders[0]?.id} students={students} />

      {photos.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-lg">{photos.length} uploaded</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Hover a photo to delete it, or use the dropdown to reassign which subject it belongs
            to.
          </p>
          <PhotoGridManager photos={photos} students={students} />
        </div>
      )}
    </div>
  );
}
