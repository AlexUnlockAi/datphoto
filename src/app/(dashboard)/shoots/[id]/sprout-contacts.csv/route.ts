import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import type { Shoot, Student } from "@/lib/types";

// Shaped for Sprout Studio's own Contacts > Import CSV flow (Sprout maps
// arbitrary columns itself, but "Name" is what it expects out of the box).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (!shoot) {
    return NextResponse.json({ error: "Shoot not found" }, { status: 404 });
  }

  const students = (studentsRes.data ?? []) as Student[];

  const csv = toCsv([
    ["Name", "Notes"],
    ...students.map((s) => [
      s.full_name,
      [
        `Shoot #${s.shoot_number}`,
        shoot.school_name,
        s.grade_or_teacher,
        s.student_id ? `ID ${s.student_id}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ]),
  ]);

  const filename = `${shoot.school_name.replace(/[^a-z0-9]+/gi, "-")}-sprout-contacts.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
