import { Card, CardContent } from "@/components/ui/card";
import { ShootCreateForm } from "@/components/app/shoot-create-form";

export default function NewShootPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl">New shoot</h1>
        <p className="text-sm text-muted-foreground">
          Any kind of session — a wedding, a family portrait, a team, a school day.
        </p>
      </div>
      <Card>
        <CardContent>
          <ShootCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
