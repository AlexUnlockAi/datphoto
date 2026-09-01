import { createClient } from "@/lib/supabase/server";
import { QuoteCreateForm } from "@/components/app/quote-create-form";
import type { Client, Shoot } from "@/lib/types";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const supabase = await createClient();

  const [clientsRes, shootsRes] = await Promise.all([
    supabase.from("clients").select("*").order("name", { ascending: true }),
    supabase.from("shoots").select("*").order("shoot_date", { ascending: false }),
  ]);

  const clients = (clientsRes.data ?? []) as Client[];
  const shoots = (shootsRes.data ?? []) as Shoot[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">New quote</h1>
        <p className="text-sm text-muted-foreground">
          Send this to a client before they commit — they can accept it online.
        </p>
      </div>
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No clients yet.{" "}
          <a href="/clients" className="text-primary hover:underline">
            Add a client first
          </a>
          .
        </p>
      ) : (
        <QuoteCreateForm clients={clients} shoots={shoots} defaultClientId={client} />
      )}
    </div>
  );
}
