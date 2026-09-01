"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { QuoteStatus } from "@/lib/types";

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
