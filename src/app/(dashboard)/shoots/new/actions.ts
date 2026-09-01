"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateShootState = { error?: string } | undefined;

export async function createShoot(
  _prevState: CreateShootState,
  formData: FormData
): Promise<CreateShootState> {
  const schoolName = String(formData.get("school_name") ?? "").trim();
  const shootDate = String(formData.get("shoot_date") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!schoolName || !shootDate) {
    return { error: "School name and date are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shoots")
    .insert({
      school_name: schoolName,
      shoot_date: shootDate,
      location: location || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create shoot." };
  }

  revalidatePath("/");
  redirect(`/shoots/${data.id}`);
}
