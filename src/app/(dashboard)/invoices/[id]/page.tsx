import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/app/invoice-status-badge";
import { PaymentStatusToggle } from "@/components/app/payment-status-toggle";
import { CopyLinkButton } from "@/components/app/copy-link-button";
import { formatCents } from "@/lib/money";
import type { Client, Invoice, InvoiceItem, Shoot } from "@/lib/types";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const invoice = invoiceData as Invoice | null;
  if (!invoice) notFound();

  const [clientRes, itemsRes, shootRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", invoice.client_id).maybeSingle(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order", { ascending: true }),
    invoice.shoot_id
      ? supabase.from("shoots").select("*").eq("id", invoice.shoot_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const client = clientRes.data as Client | null;
  const items = (itemsRes.data ?? []) as InvoiceItem[];
  const shoot = shootRes.data as Shoot | null;
  const overdue = !!invoice.due_date && invoice.due_date < new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground">
            {client?.name ?? "Unknown client"}
            {shoot ? ` · ${shoot.school_name}` : ""}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} overdue={overdue} />
      </div>

      <div className="flex flex-wrap gap-3">
        <PaymentStatusToggle invoiceId={invoice.id} status={invoice.status} />
        <CopyLinkButton path={`/i/${invoice.id}`} />
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
              {formatCents(invoice.total_cents)}
            </span>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {invoice.notes}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
