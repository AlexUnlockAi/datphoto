"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Photo } from "@/lib/types";

export async function deletePhoto(photoId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: photoData } = await supabase
    .from("photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle();
  const photo = photoData as Photo | null;
  if (!photo) return { error: "Photo not found." };

  // Refuse to delete a photo a client already paid for as part of a print
  // order — that would silently break an order that's already fulfilled.
  const { data: orderItems } = await supabase
    .from("gallery_order_items")
    .select("gallery_orders(status)")
    .eq("photo_id", photoId);
  const inPaidOrder = (orderItems ?? []).some(
    (item) =>
      (item as unknown as { gallery_orders: { status: string } | null }).gallery_orders
        ?.status === "paid"
  );
  if (inPaidOrder) {
    return { error: "This photo is part of a paid order — remove it from the order first." };
  }

  await Promise.all([
    supabase.storage.from("photos-original").remove([photo.original_path]),
    supabase.storage.from("photos-preview").remove([photo.preview_path]),
  ]);

  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) return { error: error.message };

  revalidatePath(`/shoots/${photo.shoot_id}/gallery`);
  return {};
}

export async function reassignPhotoStudent(
  photoId: string,
  studentId: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: photo, error } = await supabase
    .from("photos")
    .update({ student_id: studentId })
    .eq("id", photoId)
    .select("shoot_id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/shoots/${photo.shoot_id}/gallery`);
  return {};
}
