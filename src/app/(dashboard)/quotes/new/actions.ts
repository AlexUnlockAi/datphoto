"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendQuoteEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import type { Client } from "@/lib/types";

export type QuoteItemInput = {
  description: string;
  detail: string | null;
  quantity: number;
  unit_price_cents: number;
};

export async function createQuote(input: {
  clientId: string;
  shootId: string | null;
  expiresDate: string | null;
  introMessage: string | null;
  notes: string | null;
  items: QuoteItemInput[];
  sendEmail: boolean;
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

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      client_id: input.clientId,
      shoot_id: input.shootId,
      expires_date: input.expiresDate,
      intro_message: input.introMessage,
      notes: input.notes,
      total_cents: totalCents,
    })
    .select("id, quote_number")
    .single();

  if (error || !quote) {
    return { error: error?.message ?? "Could not create quote." };
  }

  const { error: itemsError } = await supabase.from("quote_items").insert(
    items.map((item, i) => ({
      quote_id: quote.id,
      description: item.description,
      detail: item.detail,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      sort_order: i,
    }))
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  if (input.sendEmail) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", input.clientId)
      .maybeSingle();
    const client = clientData as Client | null;

    if (client?.email) {
      const result = await sendQuoteEmail({
        to: client.email,
        clientName: client.name,
        quoteNumber: quote.quote_number,
        totalCents: totalCents,
        introMessage: input.introMessage,
        url: siteUrl(`/q/${quote.id}`),
      });
      // Best-effort, same as Stripe invoice creation elsewhere — a failed
      // send shouldn't block the quote from existing. It can be resent
      // from the quote detail page.
      if (!result.error) {
        await supabase.from("quotes").update({ status: "sent" }).eq("id", quote.id);
      } else {
        console.error("Quote email failed:", result.error);
      }
    }
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}
