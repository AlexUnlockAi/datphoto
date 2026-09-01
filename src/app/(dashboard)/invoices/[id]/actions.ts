"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type { InvoiceStatus } from "@/lib/types";

export async function setInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("stripe_invoice_id")
    .eq("id", invoiceId)
    .maybeSingle();

  // Best-effort: keep Stripe's copy in sync when marked paid/void by hand
  // (e.g. a check or cash payment) — never block the local status update on
  // a Stripe failure.
  if (invoice?.stripe_invoice_id) {
    try {
      const stripe = getStripe();
      if (status === "paid") {
        await stripe.invoices.pay(invoice.stripe_invoice_id, { paid_out_of_band: true });
      } else if (status === "void") {
        await stripe.invoices.voidInvoice(invoice.stripe_invoice_id);
      }
    } catch (err) {
      console.error("Stripe status sync failed:", err);
    }
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", invoiceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");

  return {};
}
