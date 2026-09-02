import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createStripeInvoice } from "@/lib/stripe-invoice";
import {
  getPackage,
  packageSlotList,
  PRINT_SIZE_LABELS,
  INDIVIDUAL_PRICES_CENTS,
  type PrintSize,
} from "@/lib/packages";
import type { Client, Photo } from "@/lib/types";

type Assignment = { size: PrintSize; slotIndex: number; photoId: string };

type OrderRequest = {
  shootId: string;
  name: string;
  email: string;
} & (
  | { mode: "package"; packageId: string; assignments: Assignment[] }
  | { mode: "custom"; items: { size: PrintSize; photoId: string }[] }
);

// Public route — a client on /g/[shootId] either picks a fixed package and
// assigns a photo to each print slot, or builds a custom à la carte order,
// and this turns that into a real client + Stripe invoice. Paying it
// unlocks exactly the photos they picked (see /api/photos/[id]/download
// and /g/[shootId]/page.tsx for the unlock check).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as OrderRequest | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const { shootId, name, email } = body;

  let assignments: Assignment[];
  let priceCents: number;
  let description: string;

  if (body.mode === "package") {
    const pkg = getPackage(body.packageId);
    if (!pkg) {
      return NextResponse.json({ error: "Unknown package" }, { status: 400 });
    }
    const requiredSlots = packageSlotList(pkg);
    if (
      body.assignments.length !== requiredSlots.length ||
      !requiredSlots.every((slot) =>
        body.assignments.some((a) => a.size === slot.size && a.slotIndex === slot.slotIndex)
      )
    ) {
      return NextResponse.json(
        { error: "Every print slot needs a photo before checkout" },
        { status: 400 }
      );
    }
    assignments = body.assignments;
    priceCents = pkg.priceCents;
    description = `${pkg.name} Package — ${pkg.slots
      .map((s) => `${s.count}x ${PRINT_SIZE_LABELS[s.size]}`)
      .join(", ")}`;
  } else {
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "Add at least one print" }, { status: 400 });
    }
    assignments = body.items.map((item, i) => ({ ...item, slotIndex: i }));
    priceCents = body.items.reduce((sum, item) => sum + INDIVIDUAL_PRICES_CENTS[item.size], 0);
    const counts = new Map<PrintSize, number>();
    for (const item of body.items) counts.set(item.size, (counts.get(item.size) ?? 0) + 1);
    description = `Custom prints — ${Array.from(counts.entries())
      .map(([size, count]) => `${count}x ${PRINT_SIZE_LABELS[size]}`)
      .join(", ")}`;
  }

  const supabase = createServiceClient();

  // Confirm every assigned photo actually belongs to this shoot — never
  // trust photo ids from the client body without checking.
  const { data: photosData } = await supabase
    .from("photos")
    .select("id")
    .eq("shoot_id", shootId)
    .in(
      "id",
      assignments.map((a) => a.photoId)
    );
  const validPhotoIds = new Set(((photosData ?? []) as Pick<Photo, "id">[]).map((p) => p.id));
  if (!assignments.every((a) => validPhotoIds.has(a.photoId))) {
    return NextResponse.json({ error: "One of the selected photos is invalid" }, { status: 400 });
  }

  // Find or create the client by email.
  const { data: existingClient } = await supabase
    .from("clients")
    .select("*")
    .eq("email", email.trim())
    .maybeSingle();

  let client = existingClient as Client | null;
  if (!client) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({ name: name.trim(), email: email.trim() })
      .select("*")
      .single();
    if (clientError || !newClient) {
      return NextResponse.json(
        { error: clientError?.message ?? "Could not create client" },
        { status: 500 }
      );
    }
    client = newClient as Client;
  }

  const stripeResult = await createStripeInvoice(
    supabase,
    client,
    [{ description, quantity: 1, unit_price_cents: priceCents }],
    null,
    null
  );

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: client.id,
      shoot_id: shootId,
      notes: description,
      total_cents: priceCents,
      stripe_invoice_id: stripeResult.invoiceId,
      stripe_hosted_invoice_url: stripeResult.hostedUrl,
    })
    .select("id, invoice_number")
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: invoiceError?.message ?? "Could not create invoice" },
      { status: 500 }
    );
  }

  await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    description,
    quantity: 1,
    unit_price_cents: priceCents,
    sort_order: 0,
  });

  const { data: order, error: orderError } = await supabase
    .from("gallery_orders")
    .insert({
      shoot_id: shootId,
      client_id: client.id,
      package_id: body.mode === "package" ? body.packageId : "custom",
      total_cents: priceCents,
      invoice_id: invoice.id,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "Could not create order" },
      { status: 500 }
    );
  }

  await supabase.from("gallery_order_items").insert(
    assignments.map((a) => ({
      order_id: order.id,
      photo_id: a.photoId,
      print_size: a.size,
      slot_index: a.slotIndex,
    }))
  );

  return NextResponse.json({ invoiceId: invoice.id });
}
