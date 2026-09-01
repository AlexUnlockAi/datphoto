import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createStripeInvoice } from "@/lib/stripe-invoice";
import type { Client, Quote, QuoteItem } from "@/lib/types";

// Public route — triggered by the "Accept" form on /q/[id]. Copies the quote
// and its items into a real invoice, same reasoning as the other public
// service-client routes (checkout, download).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const quote = quoteData as Quote | null;
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }
  if (quote.status === "accepted" && quote.accepted_invoice_id) {
    return NextResponse.redirect(new URL(`/i/${quote.accepted_invoice_id}`, _req.url), 303);
  }
  if (quote.status === "declined") {
    return NextResponse.json({ error: "This quote was declined" }, { status: 400 });
  }

  const { data: itemsData } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", id)
    .order("sort_order", { ascending: true });

  const items = (itemsData ?? []) as QuoteItem[];

  const { data: clientData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", quote.client_id)
    .maybeSingle();

  const stripeResult = clientData
    ? await createStripeInvoice(
        supabase,
        clientData as Client,
        items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unit_price_cents: i.unit_price_cents,
        })),
        null,
        quote.notes
      )
    : { invoiceId: null, hostedUrl: null };

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      client_id: quote.client_id,
      shoot_id: quote.shoot_id,
      notes: quote.notes,
      total_cents: quote.total_cents,
      stripe_invoice_id: stripeResult.invoiceId,
      stripe_hosted_invoice_url: stripeResult.hostedUrl,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: invoiceError?.message ?? "Could not create invoice" },
      { status: 500 }
    );
  }

  await supabase.from("invoice_items").insert(
    items.map((item, i) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      sort_order: i,
    }))
  );

  await supabase
    .from("quotes")
    .update({ status: "accepted", accepted_invoice_id: invoice.id })
    .eq("id", id);

  return NextResponse.redirect(new URL(`/i/${invoice.id}`, _req.url), 303);
}
