"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { Client } from "@/lib/types";

export type InvoiceItemInput = {
  description: string;
  quantity: number;
  unit_price_cents: number;
};

// Creates a real Stripe invoice (not just a Checkout Session) so it shows up
// in the Stripe dashboard with Stripe's own hosted payment page and PDF.
// Best-effort: if Stripe fails for any reason, the invoice still exists in
// our own system and can fall back to the /api/checkout Checkout Session
// flow — never block invoice creation on a Stripe hiccup.
async function createStripeInvoice(
  client: Client,
  items: InvoiceItemInput[],
  dueDate: string | null,
  notes: string | null
): Promise<{
  customerId: string | null;
  invoiceId: string | null;
  hostedUrl: string | null;
}> {
  try {
    const stripe = getStripe();

    let customerId = client.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: client.name,
        email: client.email ?? undefined,
        phone: client.phone ?? undefined,
      });
      customerId = customer.id;

      const supabase = await createClient();
      await supabase
        .from("clients")
        .update({ stripe_customer_id: customerId })
        .eq("id", client.id);
    }

    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: customerId,
        currency: "usd",
        description:
          item.quantity > 1 ? `${item.description} × ${item.quantity}` : item.description,
        amount: item.unit_price_cents * item.quantity,
      });
    }

    const daysUntilDue = dueDate
      ? Math.max(
          0,
          Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        )
      : 30;

    const draft = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: daysUntilDue,
      description: notes ?? undefined,
      auto_advance: false,
    });

    const finalized = await stripe.invoices.finalizeInvoice(draft.id!);

    return {
      customerId,
      invoiceId: finalized.id ?? null,
      hostedUrl: finalized.hosted_invoice_url ?? null,
    };
  } catch (err) {
    console.error("Stripe invoice creation failed:", err);
    return { customerId: null, invoiceId: null, hostedUrl: null };
  }
}

export async function createInvoice(input: {
  clientId: string;
  shootId: string | null;
  studentId: string | null;
  dueDate: string | null;
  notes: string | null;
  items: InvoiceItemInput[];
}): Promise<{ error?: string }> {
  const items = input.items.filter((i) => i.description.trim().length > 0);

  if (!input.clientId) {
    return { error: "Choose a client." };
  }
  if (items.length === 0) {
    return { error: "Add at least one line item." };
  }

  const totalCents = items.reduce(
    (sum, i) => sum + i.quantity * i.unit_price_cents,
    0
  );

  const supabase = await createClient();

  const { data: clientData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", input.clientId)
    .maybeSingle();

  const stripeResult = clientData
    ? await createStripeInvoice(clientData as Client, items, input.dueDate, input.notes)
    : { invoiceId: null, hostedUrl: null };

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      client_id: input.clientId,
      shoot_id: input.shootId,
      student_id: input.studentId,
      due_date: input.dueDate,
      notes: input.notes,
      total_cents: totalCents,
      stripe_invoice_id: stripeResult.invoiceId,
      stripe_hosted_invoice_url: stripeResult.hostedUrl,
    })
    .select("id")
    .single();

  if (error || !invoice) {
    return { error: error?.message ?? "Could not create invoice." };
  }

  const { error: itemsError } = await supabase.from("invoice_items").insert(
    items.map((item, i) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      sort_order: i,
    }))
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}
