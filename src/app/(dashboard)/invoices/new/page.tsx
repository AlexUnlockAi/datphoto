import { createClient } from "@/lib/supabase/server";
import { InvoiceCreateForm } from "@/components/app/invoice-create-form";
import type { Client, Shoot, Student } from "@/lib/types";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const supabase = await createClient();

  const [clientsRes, shootsRes, studentsRes] = await Promise.all([
    supabase.from("clients").select("*").order("name", { ascending: true }),
    supabase.from("shoots").select("*").order("shoot_date", { ascending: false }),
    supabase.from("students").select("*").order("shoot_number", { ascending: true }),
  ]);

  const clients = (clientsRes.data ?? []) as Client[];
  const shoots = (shootsRes.data ?? []) as Shoot[];
  const students = (studentsRes.data ?? []) as Student[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">New invoice</h1>
        <p className="text-sm text-muted-foreground">
          Bill a client directly and collect payment online.
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
        <InvoiceCreateForm
          clients={clients}
          shoots={shoots}
          students={students}
          defaultClientId={client}
        />
      )}
    </div>
  );
}
