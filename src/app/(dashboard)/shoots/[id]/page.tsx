import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Upload,
  ScanLine,
  Download,
  MapPin,
  CalendarDays,
  Images,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyLinkButton } from "@/components/app/copy-link-button";
import { STUDENT_STATUS_LABELS, type Shoot, type Student } from "@/lib/types";

export default async function ShootDetailPage({
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
  const total = students.length;
  const done = students.filter((s) => s.status === "photographed").length;
  const noShow = students.filter((s) => s.status === "no_show").length;
  const redo = students.filter((s) => s.status === "redo").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{shoot.school_name}</h1>
        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {new Date(shoot.shoot_date + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {shoot.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {shoot.location}
            </span>
          )}
        </div>
      </div>

      {total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-6" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold">No roster yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Import the school&rsquo;s CSV to assign shoot numbers and get ready for
                check-in.
              </p>
            </div>
            <Button render={<Link href={`/shoots/${shoot.id}/import`} />}>
              <Upload className="size-4" />
              Import roster
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total students" value={total} />
            <StatCard label="Photographed" value={done} tone="text-emerald-400" />
            <StatCard label="No-shows" value={noShow} tone="text-red-400" />
            <StatCard label="Redo needed" value={redo} tone="text-amber-400" />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button render={<Link href={`/shoots/${shoot.id}/checkin`} />}>
              <ScanLine className="size-4" />
              Open check-in
            </Button>
            <Button variant="outline" render={<Link href={`/shoots/${shoot.id}/gallery`} />}>
              <Images className="size-4" />
              Gallery
            </Button>
            <CopyLinkButton path={`/g/${shoot.id}`} />
            <Button
              variant="outline"
              render={<a href={`/shoots/${shoot.id}/shot-log.csv`} download />}
            >
              <Download className="size-4" />
              Shot log CSV
            </Button>
            <Button
              variant="outline"
              render={<a href={`/shoots/${shoot.id}/sprout-contacts.csv`} download />}
            >
              <Download className="size-4" />
              Sprout contacts CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Roster</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[28rem] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">#</th>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Group / Note</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 text-muted-foreground">{s.shoot_number}</td>
                        <td className="px-4 py-2 font-medium">{s.full_name}</td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {s.grade_or_teacher ?? "—"}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={s.status === "photographed" ? "default" : "outline"}
                          >
                            {STUDENT_STATUS_LABELS[s.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-heading text-2xl font-semibold ${tone ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
