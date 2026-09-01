import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Photo } from "@/lib/types";

// Public route, but re-checks payment server-side on every request — never
// trust the client-rendered "unlocked" state on the gallery page.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: photoData } = await supabase
    .from("photos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const photo = photoData as Photo | null;
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  if (!photo.student_id) {
    return NextResponse.json(
      { error: "This photo isn't assigned to a student yet" },
      { status: 403 }
    );
  }

  const { data: paidInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("student_id", photo.student_id)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (!paidInvoice) {
    return NextResponse.json(
      { error: "This photo hasn't been purchased yet" },
      { status: 403 }
    );
  }

  const { data: signed, error } = await supabase.storage
    .from("photos-original")
    .createSignedUrl(photo.original_path, 300);

  if (error || !signed) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create download link" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl, 303);
}
