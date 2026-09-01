"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StudentStatus } from "@/lib/types";

export async function setStudentStatus(
  shootId: string,
  studentId: string,
  status: StudentStatus
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({
      status,
      photographed_at: status === "photographed" ? new Date().toISOString() : null,
    })
    .eq("id", studentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/shoots/${shootId}`);
  revalidatePath(`/shoots/${shootId}/checkin`);

  return {};
}
