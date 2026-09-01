import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";
import { BUSINESS } from "@/lib/business";
import type { Invoice, InvoiceItem } from "@/lib/types";

// Public route — triggered by the "Pay now" form on /i/[id]. Reads with the
// service-role client, scoped to this one invoice id, same reasoning as the
// public invoice page itself.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const origin = new URL(req.url).origin;

  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const invoice = invoiceData as Invoice | null;
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (invoice.status !== "unpaid") {
    return NextResponse.redirect(`${origin}/i/${id}`, 303);
  }

  const { data: itemsData } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true });

  const items = (itemsData ?? []) as InvoiceItem[];
  if (items.length === 0) {
    return NextResponse.json({ error: "Invoice has no line items" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.unit_price_cents,
        product_data: { name: item.description },
      },
    })),
    payment_intent_data: {
      description: `${BUSINESS.name} invoice ${invoice.invoice_number}`,
    },
    metadata: { invoice_id: invoice.id },
    success_url: `${origin}/i/${id}?paid=1`,
    cancel_url: `${origin}/i/${id}`,
  });

  await supabase
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", id);

  return NextResponse.redirect(session.url!, 303);
}
