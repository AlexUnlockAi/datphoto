import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckinList } from "@/components/app/checkin-list";
import type { Shoot, Student } from "@/lib/types";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [shootRes, studentsRes] = await Promise.all([
    supabase.from("shoots").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("students")
      .select("*")
      .eq("shoot_id", id)
      .order("shoot_number", { ascending: true }),
  ]);

  const shoot = shootRes.data as Shoot | null;
  if (!shoot) notFound();

  const students = (studentsRes.data ?? []) as Student[];

  return <CheckinList shootId={shoot.id} initialStudents={students} />;
}
