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

  // Shoots without a roster (family/individual sessions — most shoots) have
  // no student to gate on, so fall back to shoot-level payment: any paid
  // invoice for this shoot unlocks all of its unassigned photos. Rostered
  // shoots keep the stricter per-student check.
  const paidQuery = photo.student_id
    ? supabase.from("invoices").select("id").eq("student_id", photo.student_id).eq("status", "paid")
    : supabase.from("invoices").select("id").eq("shoot_id", photo.shoot_id).eq("status", "paid");

  const { data: paidInvoice } = await paidQuery.limit(1).maybeSingle();

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
