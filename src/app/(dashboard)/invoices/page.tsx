import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/app/invoice-status-badge";
import { formatCents } from "@/lib/money";
import type { Invoice, Client } from "@/lib/types";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const [invoicesRes, clientsRes] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);

  const invoices = (invoicesRes.data ?? []) as Invoice[];
  const clients = new Map(
    ((clientsRes.data ?? []) as Pick<Client, "id" | "name">[]).map((c) => [c.id, c.name])
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Bill schools and clients directly, and collect payment online.
          </p>
        </div>
        <Button render={<Link href="/invoices/new" />}>
          <Plus className="size-4" />
          New invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No invoices yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const overdue = !!inv.due_date && inv.due_date < today;
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">{inv.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {clients.get(inv.client_id) ?? "Unknown client"}
                        {inv.due_date ? ` · due ${inv.due_date}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-lg">
                        {formatCents(inv.total_cents)}
                      </span>
                      <InvoiceStatusBadge status={inv.status} overdue={overdue} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
