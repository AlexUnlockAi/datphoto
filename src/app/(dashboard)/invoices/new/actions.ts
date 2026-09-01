"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createStripeInvoice } from "@/lib/stripe-invoice";
import type { Client } from "@/lib/types";

export type InvoiceItemInput = {
  description: string;
  quantity: number;
  unit_price_cents: number;
};

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
    ? await createStripeInvoice(supabase, clientData as Client, items, input.dueDate, input.notes)
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
