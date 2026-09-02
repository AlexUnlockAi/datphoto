"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendInvoiceEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import type { Client, Invoice, InvoiceStatus } from "@/lib/types";

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

  // Keep a linked gallery print order (see /api/gallery-orders) in sync
  // immediately rather than waiting on the Stripe webhook.
  if (status === "paid") {
    await supabase.from("gallery_orders").update({ status: "paid" }).eq("invoice_id", invoiceId);
  }

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");

  return {};
}

export async function emailInvoiceToClient(invoiceId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();
  const invoice = invoiceData as Invoice | null;
  if (!invoice) return { error: "Invoice not found." };

  const { data: clientData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", invoice.client_id)
    .maybeSingle();
  const client = clientData as Client | null;
  if (!client?.email) {
    return { error: "This client doesn't have an email on file." };
  }

  const result = await sendInvoiceEmail({
    to: client.email,
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    totalCents: invoice.total_cents,
    url: siteUrl(`/i/${invoice.id}`),
  });
  if (result.error) return { error: result.error };

  revalidatePath(`/invoices/${invoiceId}`);
  return {};
}
