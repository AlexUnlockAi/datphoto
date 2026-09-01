import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import type { Shoot, Student } from "@/lib/types";

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
    ["shoot_number", "full_name", "grade_or_teacher", "student_id", "status"],
    ...students.map((s) => [
      s.shoot_number,
      s.full_name,
      s.grade_or_teacher,
      s.student_id,
      s.status,
    ]),
  ]);

  const filename = `${shoot.school_name.replace(/[^a-z0-9]+/gi, "-")}-shot-log.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
