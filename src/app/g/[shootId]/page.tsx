import { notFound } from "next/navigation";
import { Lock, Download } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { publicStorageUrl } from "@/lib/storage";
import { BUSINESS } from "@/lib/business";
import { GalleryOrderBuilder } from "@/components/app/gallery-order-builder";
import type { GalleryOrder, GalleryOrderItem, Invoice, Photo, Shoot, Student } from "@/lib/types";

// Public, unauthenticated gallery — shared per shoot (every family sees the
// same grid). Reads with the service-role client, same reasoning as the
// other public pages. Download links are gated separately by
// /api/photos/[id]/download, which re-checks payment itself.
export default async function PublicGalleryPage({
  params,
}: {
  params: Promise<{ shootId: string }>;
}) {
  const { shootId } = await params;
  const supabase = createServiceClient();

  const { data: shootData } = await supabase
    .from("shoots")
    .select("*")
    .eq("id", shootId)
    .maybeSingle();

  const shoot = shootData as Shoot | null;
  if (!shoot) notFound();

  const [photosRes, studentsRes, paidInvoicesRes, paidOrdersRes] = await Promise.all([
    supabase
      .from("photos")
      .select("*")
      .eq("shoot_id", shootId)
      .order("sort_order", { ascending: true }),
    supabase.from("students").select("*").eq("shoot_id", shootId),
    supabase.from("invoices").select("student_id").eq("shoot_id", shootId).eq("status", "paid"),
    supabase.from("gallery_orders").select("id").eq("shoot_id", shootId).eq("status", "paid"),
  ]);

  const photos = (photosRes.data ?? []) as Photo[];
  const students = new Map(
    ((studentsRes.data ?? []) as Student[]).map((s) => [s.id, s])
  );
  const paidInvoices = (paidInvoicesRes.data ?? []) as Pick<Invoice, "student_id">[];
  const paidStudentIds = new Set(
    paidInvoices.map((i) => i.student_id).filter((id): id is string => !!id)
  );
  // Shoots with no roster (family/individual sessions — most shoots) have no
  // student to gate photos on, so any paid invoice for the shoot unlocks
  // every unassigned photo in it.
  const shootPaidWithNoRoster = students.size === 0 && paidInvoices.length > 0;

  const paidOrderIds = ((paidOrdersRes.data ?? []) as Pick<GalleryOrder, "id">[]).map((o) => o.id);
  const paidOrderItemsRes =
    paidOrderIds.length > 0
      ? await supabase.from("gallery_order_items").select("photo_id").in("order_id", paidOrderIds)
      : { data: [] };
  const unlockedByOrderIds = new Set(
    ((paidOrderItemsRes.data ?? []) as Pick<GalleryOrderItem, "photo_id">[]).map((i) => i.photo_id)
  );

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-border pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="DatPhotography" className="h-14 w-auto" />
          <h1 className="mt-3 font-heading text-xl">{shoot.school_name}</h1>
          <p className="text-sm text-muted-foreground">
            Browse the gallery below, then choose a print package to select your favorites.
            Photos unlock for full-resolution download automatically once you pay — questions?
            reach out to {BUSINESS.email}.
          </p>
        </div>

        {photos.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No photos uploaded yet — check back soon.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => {
              const student = photo.student_id ? students.get(photo.student_id) : null;
              const unlocked =
                unlockedByOrderIds.has(photo.id) ||
                (photo.student_id ? paidStudentIds.has(photo.student_id) : shootPaidWithNoRoster);
              return (
                <div key={photo.id} className="space-y-2">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={publicStorageUrl("photos-preview", photo.preview_path)}
                      alt={student?.full_name ?? "Photo"}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs text-muted-foreground">
                      {student ? student.full_name : "Unassigned"}
                    </p>
                    {unlocked ? (
                      <a
                        href={`/api/photos/${photo.id}/download`}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Download className="size-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3.5" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {photos.length > 0 && (
          <GalleryOrderBuilder
            shootId={shoot.id}
            photos={photos.map((p) => ({
              id: p.id,
              url: publicStorageUrl("photos-preview", p.preview_path),
            }))}
          />
        )}
      </div>
    </div>
  );
}
