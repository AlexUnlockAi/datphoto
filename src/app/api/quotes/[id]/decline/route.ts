import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Public route — triggered by the "Decline" form on /q/[id].
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (quote && quote.status !== "accepted") {
    await supabase.from("quotes").update({ status: "declined" }).eq("id", id);
  }

  return NextResponse.redirect(new URL(`/q/${id}`, req.url), 303);
}
