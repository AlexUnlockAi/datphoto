import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  // Legacy path: an invoice paid through our own /api/checkout Checkout
  // Session (invoices created before real Stripe Invoicing, or if it
  // failed at creation time and fell back).
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoice_id;

    if (invoiceId) {
      const supabase = createServiceClient();
      await supabase
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("id", invoiceId);
    }
  }

  // Primary path: a real Stripe Invoice (created via the Invoicing API) was
  // paid — either through Stripe's hosted page or marked paid_out_of_band
  // when we sync a manual "mark paid" from the dashboard.
  if (event.type === "invoice.paid") {
    const stripeInvoice = event.data.object;
    const supabase = createServiceClient();
    await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("stripe_invoice_id", stripeInvoice.id);
  }

  return NextResponse.json({ received: true });
}
