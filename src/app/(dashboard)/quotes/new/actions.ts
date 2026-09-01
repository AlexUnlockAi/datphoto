"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    .select("id")
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

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}
