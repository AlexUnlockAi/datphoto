"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Photo } from "@/lib/types";

// Deleting a shoot cascades its roster and gallery rows at the DB level
// (see supabase/migrations/0001_init.sql, 0005_gallery.sql) and detaches —
// rather than deletes — any invoices/quotes that reference it, so billing
// history survives. The one thing the DB cascade can't reach is the actual
// files sitting in Storage, so those are removed here first.
export async function deleteShoot(shootId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: photosData } = await supabase
    .from("photos")
    .select("original_path, preview_path")
    .eq("shoot_id", shootId);

  const photos = (photosData ?? []) as Pick<Photo, "original_path" | "preview_path">[];

  if (photos.length > 0) {
    await Promise.all([
      supabase.storage
        .from("photos-original")
        .remove(photos.map((p) => p.original_path)),
      supabase.storage
        .from("photos-preview")
        .remove(photos.map((p) => p.preview_path)),
    ]);
  }

  const { error } = await supabase.from("shoots").delete().eq("id", shootId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/shoots");
  revalidatePath("/");
  redirect("/shoots");
}
