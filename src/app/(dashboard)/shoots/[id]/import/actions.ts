"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ImportRow = {
  full_name: string;
  grade_or_teacher: string | null;
  student_id: string | null;
};

export async function importRoster(
  shootId: string,
  rows: ImportRow[]
): Promise<{ error?: string; inserted?: number }> {
  const cleanRows = rows
    .map((r) => ({ ...r, full_name: r.full_name.trim() }))
    .filter((r) => r.full_name.length > 0);

  if (cleanRows.length === 0) {
    return { error: "No rows with a name to import." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("students")
    .select("shoot_number")
    .eq("shoot_id", shootId)
    .order("shoot_number", { ascending: false })
    .limit(1);

  const startNumber = (existing?.[0]?.shoot_number ?? 0) + 1;

  const toInsert = cleanRows.map((r, i) => ({
    shoot_id: shootId,
    shoot_number: startNumber + i,
    full_name: r.full_name,
    grade_or_teacher: r.grade_or_teacher || null,
    student_id: r.student_id || null,
  }));

  const { error } = await supabase.from("students").insert(toInsert);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/shoots/${shootId}`);
  revalidatePath("/shoots");

  return { inserted: toInsert.length };
}
