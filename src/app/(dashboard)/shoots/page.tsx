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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl">Shoots</h1>
        <p className="text-sm text-muted-foreground">
          Every session — weddings, portraits, teams, events, school days — with its
          roster, check-in progress, and gallery in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-2">
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
                  <Card
                    size="sm"
                    className="transition-colors hover:border-primary/40 hover:ring-primary/20"
                  >
                    <CardContent className="flex items-center justify-between gap-4 py-1">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{shoot.school_name}</p>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {new Date(shoot.shoot_date + "T00:00:00").toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </span>
                          {shoot.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {shoot.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant={counts.total === 0 ? "outline" : "secondary"}>
                          <Camera className="size-3" />
                          {counts.total === 0
                            ? "No roster yet"
                            : `${counts.done} / ${counts.total} done`}
                        </Badge>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        <Card size="sm" className="h-fit">
          <CardHeader>
            <CardTitle>New shoot</CardTitle>
            <CardDescription>Any kind of session — set it up here.</CardDescription>
          </CardHeader>
          <CardContent>
            <ShootCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
