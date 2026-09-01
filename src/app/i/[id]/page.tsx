import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { formatCents } from "@/lib/money";
import { BUSINESS } from "@/lib/business";
import { INVOICE_STATUS_LABELS, type Client, type Invoice, type InvoiceItem } from "@/lib/types";

// Public, unauthenticated page — reads with the service-role client, scoped
// to this one invoice id. See supabase/migrations/0002_invoices.sql for why
// there's no anon RLS policy on invoices instead.
export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const supabase = createServiceClient();

  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const invoice = invoiceData as Invoice | null;
  if (!invoice) notFound();

  const [clientRes, itemsRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", invoice.client_id).maybeSingle(),
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  const client = clientRes.data as Client | null;
  const items = (itemsRes.data ?? []) as InvoiceItem[];

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-2xl">
        {paid === "1" && invoice.status === "unpaid" && (
          <div className="mb-6 border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            Payment received — thank you! This page will update shortly.
          </div>
        )}
        <div className="flex items-start justify-between border-b border-border pb-8">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="DatPhotography" className="h-14 w-auto" />
            <p className="mt-2 text-sm text-muted-foreground">{BUSINESS.email}</p>
            <p className="text-sm text-muted-foreground">{BUSINESS.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-heading text-xl">{invoice.invoice_number}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Issued {invoice.issue_date}
            </p>
            {invoice.due_date && (
              <p className="text-sm text-muted-foreground">Due {invoice.due_date}</p>
            )}
            <p className="mt-2 text-sm font-medium text-primary">
              {INVOICE_STATUS_LABELS[invoice.status]}
            </p>
          </div>
        </div>

        {client && (
          <div className="pt-8">
            <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
              Bill to
            </p>
            <p className="mt-1 font-medium">{client.name}</p>
            {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
            {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
          </div>
        )}

        <div className="mt-8 space-y-3">
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
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <span className="font-heading text-lg">Total</span>
          <span className="font-heading text-3xl text-primary">
            {formatCents(invoice.total_cents)}
          </span>
        </div>

        {invoice.status === "unpaid" && invoice.stripe_hosted_invoice_url && (
          <a
            href={invoice.stripe_hosted_invoice_url}
            className="mt-8 block bg-primary py-3 text-center font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Pay {formatCents(invoice.total_cents)} now
          </a>
        )}
        {invoice.status === "unpaid" && !invoice.stripe_hosted_invoice_url && (
          <form action={`/api/checkout/${invoice.id}`} method="POST" className="mt-8">
            <button
              type="submit"
              className="w-full bg-primary py-3 text-center font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Pay {formatCents(invoice.total_cents)} now
            </button>
          </form>
        )}
        {invoice.status === "paid" && (
          <p className="mt-8 text-center text-sm text-emerald-400">
            This invoice has been paid.
          </p>
        )}

        {invoice.notes && (
          <p className="mt-8 text-sm whitespace-pre-line text-muted-foreground">
            {invoice.notes}
          </p>
        )}
      </div>
    </div>
  );
}
