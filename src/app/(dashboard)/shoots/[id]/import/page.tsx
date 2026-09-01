import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CsvImportClient } from "@/components/app/csv-import-client";
import type { Shoot } from "@/lib/types";

export default async function ImportRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: shoot } = await supabase
    .from("shoots")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!shoot) notFound();
  const typedShoot = shoot as Shoot;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Import roster</h1>
        <p className="text-sm text-muted-foreground">{typedShoot.school_name}</p>
      </div>
      <CsvImportClient shootId={typedShoot.id} />
    </div>
  );
}
