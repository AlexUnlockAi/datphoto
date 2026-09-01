import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteStatusBadge } from "@/components/app/quote-status-badge";
import { QuoteStatusToggle } from "@/components/app/quote-status-toggle";
import { CopyLinkButton } from "@/components/app/copy-link-button";
import { formatCents } from "@/lib/money";
import type { Client, Quote, QuoteItem, Shoot } from "@/lib/types";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const quote = quoteData as Quote | null;
  if (!quote) notFound();

  const [clientRes, itemsRes, shootRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", quote.client_id).maybeSingle(),
    supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", id)
      .order("sort_order", { ascending: true }),
    quote.shoot_id
      ? supabase.from("shoots").select("*").eq("id", quote.shoot_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const client = clientRes.data as Client | null;
  const items = (itemsRes.data ?? []) as QuoteItem[];
  const shoot = shootRes.data as Shoot | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl">{quote.quote_number}</h1>
          <p className="text-sm text-muted-foreground">
            {client?.name ?? "Unknown client"}
            {shoot ? ` · ${shoot.school_name}` : ""}
          </p>
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      <div className="flex flex-wrap gap-3">
        <QuoteStatusToggle quoteId={quote.id} status={quote.status} />
        <CopyLinkButton path={`/q/${quote.id}`} />
        {quote.accepted_invoice_id && (
          <Link
            href={`/invoices/${quote.accepted_invoice_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            View resulting invoice <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.description}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              </span>
              <span className="text-muted-foreground">
                {formatCents(item.quantity * item.unit_price_cents)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="font-heading text-xl text-primary">
              {formatCents(quote.total_cents)}
            </span>
          </div>
        </CardContent>
      </Card>

      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{quote.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
