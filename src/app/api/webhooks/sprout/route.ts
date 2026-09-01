import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isSproutEventType } from "@/lib/sprout";

// One Zap per Sprout trigger (New Lead, Lead Status Change, New Shoot,
// Payment Made), each posting here via "Webhooks by Zapier" to:
//   https://<your-domain>/api/webhooks/sprout?token=<SPROUT_WEBHOOK_TOKEN>&event=payment_made
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const event = url.searchParams.get("event");

  if (!process.env.SPROUT_WEBHOOK_TOKEN || token !== process.env.SPROUT_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!event || !isSproutEventType(event)) {
    return NextResponse.json(
      { error: "Missing or unknown ?event= (expected new_lead, lead_status_change, new_shoot, or payment_made)" },
      { status: 400 }
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    // Zapier can send an empty body on test pings — still log the event.
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("sprout_events")
    .insert({ event_type: event, payload });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
