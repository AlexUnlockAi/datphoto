import Link from "next/link";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  Camera,
  MapPin,
  FileText,
  Receipt,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/app/invoice-status-badge";
import { QuoteStatusBadge } from "@/components/app/quote-status-badge";
import { RevenueChart, type MonthlyRevenue } from "@/components/app/revenue-chart";
import { formatCents } from "@/lib/money";
import type { Client, Invoice, Quote, Shoot } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [invoicesRes, quotesRes, shootsRes, clientsRes, quotesPendingRes] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("quotes").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("shoots").select("*").order("shoot_date", { ascending: true }),
    supabase.from("clients").select("id, name"),
    supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "sent"),
  ]);

  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const quotes = (quotesRes.data ?? []) as Quote[];
  const shoots = (shootsRes.data ?? []) as Shoot[];
  const clientRows = (clientsRes.data ?? []) as Pick<Client, "id" | "name">[];
  const clients = new Map(clientRows.map((c) => [c.id, c.name]));
  const quotesPendingCount = quotesPendingRes.count ?? 0;

  const paid = invoices.filter((i) => i.status === "paid");
  const unpaid = invoices.filter((i) => i.status === "unpaid");
  const totalRevenueCents = paid.reduce((sum, i) => sum + i.total_cents, 0);
  const outstandingCents = unpaid.reduce((sum, i) => sum + i.total_cents, 0);

  const now = new Date();
  const monthLabel = (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: "short" }) };
  };
  const months = Array.from({ length: 6 }, (_, i) => monthLabel(5 - i));
  const revenueByMonth: MonthlyRevenue[] = months.map(({ key, label }) => {
    const cents = paid.reduce((sum, i) => {
      if (!i.paid_at) return sum;
      const d = new Date(i.paid_at);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      return k === key ? sum + i.total_cents : sum;
    }, 0);
    return { label, cents };
  });
  const thisMonthCents = revenueByMonth[revenueByMonth.length - 1]?.cents ?? 0;

  const upcomingShoots = shoots.filter((s) => s.shoot_date >= today).slice(0, 5);

  type Activity = {
    id: string;
    kind: "invoice" | "quote";
    number: string;
    clientName: string;
    totalCents: number;
    status: string;
    createdAt: string;
  };
  const activity: Activity[] = [
    ...invoices.map((i) => ({
      id: i.id,
      kind: "invoice" as const,
      number: i.invoice_number,
      clientName: clients.get(i.client_id) ?? "Unknown",
      totalCents: i.total_cents,
      status: i.status,
      createdAt: i.created_at,
    })),
    ...quotes.map((q) => ({
      id: q.id,
      kind: "quote" as const,
      number: q.quote_number,
      clientName: clients.get(q.client_id) ?? "Unknown",
      totalCents: q.total_cents,
      status: q.status,
      createdAt: q.created_at,
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="hud-label mb-1">Overview</p>
          <h1 className="font-heading text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Revenue, outstanding balance, and what&rsquo;s coming up.
          </p>
        </div>
        <p className="hidden font-mono text-xs text-muted-foreground sm:block">
          {invoices.length} invoices · {quotes.length} quotes · {shoots.length} shoots
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatTile
          icon={DollarSign}
          label="Total revenue"
          value={formatCents(totalRevenueCents)}
        />
        <StatTile
          icon={TrendingUp}
          label="This month"
          value={formatCents(thisMonthCents)}
        />
        <StatTile
          icon={Wallet}
          label="Outstanding"
          value={formatCents(outstandingCents)}
          tone={outstandingCents > 0 ? "text-amber-400" : undefined}
        />
        <StatTile
          icon={Camera}
          label="Upcoming shoots"
          value={String(upcomingShoots.length)}
        />
        <StatTile
          icon={FileText}
          label="Quotes pending"
          value={String(quotesPendingCount)}
        />
        <StatTile
          icon={Users}
          label="Active clients"
          value={String(clientRows.length)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card size="sm">
          <CardHeader>
            <p className="hud-label">Revenue</p>
            <CardTitle>Last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByMonth} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="hud-label">Schedule</p>
              <CardTitle>Upcoming shoots</CardTitle>
            </div>
            <Link href="/shoots" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingShoots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing scheduled.
              </p>
            ) : (
              upcomingShoots.map((s) => (
                <Link
                  key={s.id}
                  href={`/shoots/${s.id}`}
                  className="flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.school_name}</p>
                    {s.location && (
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {s.location}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(s.shoot_date + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card size="sm">
        <CardHeader>
          <p className="hud-label">Activity log</p>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing yet — create a quote or invoice to see it here.
            </p>
          ) : (
            activity.map((a) => (
              <Link
                key={`${a.kind}-${a.id}`}
                href={a.kind === "invoice" ? `/invoices/${a.id}` : `/quotes/${a.id}`}
                className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {a.kind === "invoice" ? (
                    <Receipt className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="shrink-0 font-medium">{a.number}</span>
                  <span className="truncate text-muted-foreground">{a.clientName}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span>{formatCents(a.totalCents)}</span>
                  {a.kind === "invoice" ? (
                    <InvoiceStatusBadge status={a.status as Invoice["status"]} />
                  ) : (
                    <QuoteStatusBadge status={a.status as Quote["status"]} />
                  )}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <Card size="sm" className="hud-corners border-t-2 border-t-primary/40">
      <CardContent className="space-y-2 py-1">
        <div className="flex items-center justify-between">
          <Icon className="size-3.5 text-primary/70" />
          <p className="hud-label !text-muted-foreground/70">{label}</p>
        </div>
        <p className={`truncate font-mono text-xl font-medium tabular-nums ${tone ?? ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
