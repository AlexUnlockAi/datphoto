import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { formatCents } from "@/lib/money";
import { BUSINESS } from "@/lib/business";
import { QUOTE_STATUS_LABELS, type Client, type Quote, type QuoteItem } from "@/lib/types";

// Public, unauthenticated page — same reasoning as /i/[id]: reads with the
// service-role client, scoped to this one quote id, no anon RLS policy.
export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: quoteData } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const quote = quoteData as Quote | null;
  if (!quote) notFound();

  const [clientRes, itemsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", quote.client_id).maybeSingle(),
    supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  const client = clientRes.data as Client | null;
  const items = (itemsRes.data ?? []) as QuoteItem[];
  const isOpen = quote.status === "draft" || quote.status === "sent";

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between border-b border-border pb-8">
          <div>
            <span className="font-heading text-2xl tracking-wider">
              Dat<span className="text-primary">Photography</span>
            </span>
            <p className="mt-2 text-sm text-muted-foreground">{BUSINESS.email}</p>
            <p className="text-sm text-muted-foreground">{BUSINESS.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-heading text-xl">{quote.quote_number}</p>
            <p className="mt-1 text-sm text-muted-foreground">Issued {quote.issue_date}</p>
            {quote.expires_date && (
              <p className="text-sm text-muted-foreground">Expires {quote.expires_date}</p>
            )}
            <p className="mt-2 text-sm font-medium text-primary">
              {QUOTE_STATUS_LABELS[quote.status]}
            </p>
          </div>
        </div>

        {client && (
          <div className="pt-8">
            <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">For</p>
            <p className="mt-1 font-medium">{client.name}</p>
          </div>
        )}

        {quote.intro_message && (
          <p className="mt-6 border border-border bg-card px-5 py-4 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
            {quote.intro_message}
          </p>
        )}

        <div className="mt-10">
          <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
            What&rsquo;s included
          </p>
          <div className="mt-3 space-y-5">
            {items.map((item) => (
              <div key={item.id} className="border-l-2 border-primary/40 pl-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium">
                    {item.description}
                    {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                  </p>
                  <p className="shrink-0 font-medium text-primary">
                    {formatCents(item.quantity * item.unit_price_cents)}
                  </p>
                </div>
                {item.detail && (
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {item.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <span className="font-heading text-lg">Total</span>
          <span className="font-heading text-3xl text-primary">
            {formatCents(quote.total_cents)}
          </span>
        </div>

        {isOpen && (
          <div className="mt-8 flex gap-3">
            <form action={`/api/quotes/${quote.id}/accept`} method="POST" className="flex-1">
              <button
                type="submit"
                className="w-full bg-primary py-3 text-center font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Accept quote
              </button>
            </form>
            <form action={`/api/quotes/${quote.id}/decline`} method="POST">
              <button
                type="submit"
                className="border border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Decline
              </button>
            </form>
          </div>
        )}
        {quote.status === "accepted" && (
          <p className="mt-8 text-center text-sm text-emerald-400">
            This quote has been accepted.
          </p>
        )}
        {quote.status === "declined" && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            This quote was declined.
          </p>
        )}

        {quote.notes && (
          <div className="mt-10 border-t border-border pt-6">
            <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
              Terms
            </p>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {quote.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
