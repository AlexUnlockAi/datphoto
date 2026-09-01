import Link from "next/link";
import { ArrowRight, Camera, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShootCreateForm } from "@/components/app/shoot-create-form";
import type { Shoot, Student } from "@/lib/types";

export default async function ShootsPage() {
  const supabase = await createClient();

  const [shootsRes, studentsRes] = await Promise.all([
    supabase.from("shoots").select("*").order("shoot_date", { ascending: false }),
    supabase.from("students").select("shoot_id, status"),
  ]);

  const shoots = (shootsRes.data ?? []) as Shoot[];
  const students = (studentsRes.data ?? []) as Pick<Student, "shoot_id" | "status">[];

  const countsByShoot = new Map<string, { total: number; done: number }>();
  for (const s of students) {
    const entry = countsByShoot.get(s.shoot_id) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (s.status === "photographed") entry.done += 1;
    countsByShoot.set(s.shoot_id, entry);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Shoots</h1>
        <p className="text-sm text-muted-foreground">
          Every school shoot, roster, and check-in progress in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {shoots.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No shoots yet — create your first one to get started.
              </CardContent>
            </Card>
          ) : (
            shoots.map((shoot) => {
              const counts = countsByShoot.get(shoot.id) ?? { total: 0, done: 0 };
              return (
                <Link key={shoot.id} href={`/shoots/${shoot.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{shoot.school_name}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-3">
                          <span>
                            {new Date(shoot.shoot_date + "T00:00:00").toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </span>
                          {shoot.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" />
                              {shoot.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                      <Badge variant={counts.total === 0 ? "outline" : "secondary"}>
                        <Camera className="size-3" />
                        {counts.total === 0
                          ? "No roster yet"
                          : `${counts.done} / ${counts.total} photographed`}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New shoot</CardTitle>
            <CardDescription>Set up a school before shoot day.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShootCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
