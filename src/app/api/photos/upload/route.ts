import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { watermarkImage } from "@/lib/watermark";

// Requires the Node.js runtime (not Edge) — sharp needs native bindings.
export const runtime = "nodejs";

// Protected by proxy.ts (this path isn't in the public-route exemption
// list), so only an authenticated admin session can reach this. Writes use
// the regular authenticated client — RLS already grants authenticated
// full access to both storage buckets and the photos table.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const shootId = formData.get("shootId");
  const studentId = formData.get("studentId");
  const folderId = formData.get("folderId");

  if (!(file instanceof File) || typeof shootId !== "string" || !shootId) {
    return NextResponse.json({ error: "Missing file or shootId" }, { status: 400 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());

  let watermarked: Buffer;
  try {
    watermarked = await watermarkImage(originalBuffer);
  } catch {
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  const id = randomUUID();
  const originalPath = `${shootId}/${id}-original`;
  const previewPath = `${shootId}/${id}-preview.jpg`;

  const [originalUpload, previewUpload] = await Promise.all([
    supabase.storage
      .from("photos-original")
      .upload(originalPath, originalBuffer, {
        contentType: file.type || "application/octet-stream",
      }),
    supabase.storage
      .from("photos-preview")
      .upload(previewPath, watermarked, { contentType: "image/jpeg" }),
  ]);

  if (originalUpload.error || previewUpload.error) {
    return NextResponse.json(
      { error: originalUpload.error?.message ?? previewUpload.error?.message },
      { status: 500 }
    );
  }

  let validFolderId: string | null = null;
  if (typeof folderId === "string" && folderId) {
    const { data: folder } = await supabase
      .from("gallery_folders")
      .select("id")
      .eq("id", folderId)
      .eq("shoot_id", shootId)
      .maybeSingle();
    if (!folder) return NextResponse.json({ error: "Invalid gallery folder" }, { status: 400 });
    validFolderId = folder.id;
  }

  const { data: photo, error } = await supabase
    .from("photos")
    .insert({
      shoot_id: shootId,
      folder_id: validFolderId,
      student_id: typeof studentId === "string" && studentId ? studentId : null,
      original_path: originalPath,
      preview_path: previewPath,
      original_filename: file.name,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: photo.id });
}
