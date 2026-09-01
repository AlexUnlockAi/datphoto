import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteStatusBadge } from "@/components/app/quote-status-badge";
import { formatCents } from "@/lib/money";
import type { Quote, Client } from "@/lib/types";

export default async function QuotesPage() {
  const supabase = await createClient();

  const [quotesRes, clientsRes] = await Promise.all([
    supabase.from("quotes").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);

  const quotes = (quotesRes.data ?? []) as Quote[];
  const clients = new Map(
    ((clientsRes.data ?? []) as Pick<Client, "id" | "name">[]).map((c) => [c.id, c.name])
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Send a price quote before the sale — accepted quotes become invoices.
          </p>
        </div>
        <Button render={<Link href="/quotes/new" />}>
          <Plus className="size-4" />
          New quote
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No quotes yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => (
            <Link key={q.id} href={`/quotes/${q.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{q.quote_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {clients.get(q.client_id) ?? "Unknown client"}
                      {q.expires_date ? ` · expires ${q.expires_date}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-heading text-lg">{formatCents(q.total_cents)}</span>
                    <QuoteStatusBadge status={q.status} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
