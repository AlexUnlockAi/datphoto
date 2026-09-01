import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import type { Client } from "@/lib/types";

export type StripeInvoiceItemInput = {
  description: string;
  quantity: number;
  unit_price_cents: number;
};

// Creates a real Stripe invoice (not just a Checkout Session) so it shows up
// in the Stripe dashboard with Stripe's own hosted payment page and PDF.
// Shared by direct invoice creation and by quote acceptance, since both
// paths need every invoice to exist in Stripe. Best-effort: if Stripe fails
// for any reason, the invoice still exists in our own system and can fall
// back to the /api/checkout Checkout Session flow — never block invoice
// creation on a Stripe hiccup.
export async function createStripeInvoice(
  supabase: SupabaseClient,
  client: Client,
  items: StripeInvoiceItemInput[],
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
      // Stripe does not auto-attach pending invoice items unless told to —
      // without this the invoice finalizes empty ($0.00).
      pending_invoice_items_behavior: "include",
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
