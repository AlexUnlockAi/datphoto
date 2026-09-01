import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ClientCreateForm } from "@/components/app/client-create-form";
import type { Client } from "@/lib/types";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  const clients = (data ?? []) as Client[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl">Clients</h1>
        <p className="text-sm text-muted-foreground">
          Schools and businesses you invoice directly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          {clients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No clients yet — add one to start invoicing.
              </CardContent>
            </Card>
          ) : (
            clients.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <Link
                    href={`/invoices/new?client=${c.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    New invoice
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New client</CardTitle>
            <CardDescription>A school, family, or business you bill.</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
