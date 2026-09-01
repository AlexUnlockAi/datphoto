import { Activity, DollarSign, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SPROUT_EVENT_LABELS, type SproutEvent } from "@/lib/types";
import { summarizeSproutEvent } from "@/lib/sprout";

export default async function ActivityPage() {
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("sprout_events")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(100);

  const events = (data ?? []) as SproutEvent[];
  const today = events.filter((e) => new Date(e.received_at) >= startOfToday);
  const paymentsToday = today.filter((e) => e.event_type === "payment_made").length;
  const leadsToday = today.filter((e) => e.event_type === "new_lead").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Sprout Activity</h1>
        <p className="text-sm text-muted-foreground">
          Live feed from Sprout Studio via Zapier &mdash; payments, leads, and shoots
          as they happen. This is the only real-time signal Sprout exposes.
        </p>
      </div>

      {events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No events yet. Once the Sprout → Zapier → webhook Zaps are wired up,
            activity will show here automatically.
          </CardContent>
        </Card>
      )}

      {events.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payments today</p>
                  <p className="font-heading text-xl font-semibold">{paymentsToday}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New leads today</p>
                  <p className="font-heading text-xl font-semibold">{leadsToday}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent events</CardTitle>
              <CardDescription>Newest first, last 100 events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Activity className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{SPROUT_EVENT_LABELS[e.event_type]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.received_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm">
                      {summarizeSproutEvent(e.event_type, e.payload)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
