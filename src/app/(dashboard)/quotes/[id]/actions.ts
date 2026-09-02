"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendQuoteEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import type { Client, Quote, QuoteStatus } from "@/lib/types";

export async function setQuoteStatus(
  quoteId: string,
  status: QuoteStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("quotes").update({ status }).eq("id", quoteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");

  return {};
}

export async function emailQuoteToClient(quoteId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle();
  const quote = quoteData as Quote | null;
  if (!quote) return { error: "Quote not found." };

  const { data: clientData } = await supabase
    .from("clients")
    .select("*")
    .eq("id", quote.client_id)
    .maybeSingle();
  const client = clientData as Client | null;
  if (!client?.email) {
    return { error: "This client doesn't have an email on file." };
  }

  const result = await sendQuoteEmail({
    to: client.email,
    clientName: client.name,
    quoteNumber: quote.quote_number,
    totalCents: quote.total_cents,
    introMessage: quote.intro_message,
    url: siteUrl(`/q/${quote.id}`),
  });
  if (result.error) return { error: result.error };

  if (quote.status === "draft") {
    await supabase.from("quotes").update({ status: "sent" }).eq("id", quoteId);
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/quotes");
  return {};
}
