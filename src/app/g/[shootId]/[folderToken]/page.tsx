import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { publicStorageUrl } from "@/lib/storage";
import { BUSINESS } from "@/lib/business";
import { GalleryOrderBuilder } from "@/components/app/gallery-order-builder";
import type { GalleryFolder, Photo, Shoot } from "@/lib/types";

export default async function PublicFolderGallery({ params }: { params: Promise<{ shootId: string; folderToken: string }> }) {
  const { shootId, folderToken } = await params;
  const supabase = createServiceClient();
  const { data: folderData } = await supabase.from("gallery_folders").select("*").eq("shoot_id", shootId).eq("public_token", folderToken).eq("is_active", true).maybeSingle();
  const folder = folderData as GalleryFolder | null;
  if (!folder) notFound();
  const [{ data: shootData }, { data: photosData }] = await Promise.all([
    supabase.from("shoots").select("*").eq("id", shootId).maybeSingle(),
    supabase.from("photos").select("*").eq("shoot_id", shootId).eq("folder_id", folder.id).order("sort_order"),
  ]);
  const shoot = shootData as Shoot | null;
  if (!shoot) notFound();
  const photos = (photosData ?? []) as Photo[];
  return <div className="min-h-screen bg-background px-6 py-12 text-foreground"><div className="mx-auto max-w-6xl">
    <div className="border-b border-border pb-6"><img src="/logo.png" alt="DatPhotography" className="h-14 w-auto" /><h1 className="mt-3 font-heading text-xl">{folder.name}</h1><p className="text-sm text-muted-foreground">{shoot.school_name} · Browse your private selection, then choose a package or individual prints. Questions? {BUSINESS.email}.</p></div>
    {photos.length === 0 ? <p className="mt-10 text-center text-sm text-muted-foreground">No photos uploaded yet — check back soon.</p> : <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{photos.map((photo) => <div key={photo.id} className="aspect-square overflow-hidden bg-muted"><img src={publicStorageUrl("photos-preview", photo.preview_path)} alt={photo.original_filename ?? "Gallery photo"} className="size-full object-cover" /></div>)}</div>}
    {photos.length > 0 && <GalleryOrderBuilder shootId={shoot.id} folderId={folder.id} photos={photos.map((p) => ({ id: p.id, url: publicStorageUrl("photos-preview", p.preview_path) }))} />}
  </div></div>;
}
