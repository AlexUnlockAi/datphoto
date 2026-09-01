"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createShoot,
  type CreateShootState,
} from "@/app/(dashboard)/shoots/new/actions";

export function ShootCreateForm() {
  const [state, action, pending] = useActionState<CreateShootState, FormData>(
    createShoot,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="school_name">School name</Label>
        <Input id="school_name" name="school_name" required placeholder="Lincoln Elementary" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shoot_date">Shoot date</Label>
        <Input id="shoot_date" name="shoot_date" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" name="location" placeholder="Gymnasium" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create shoot
      </Button>
    </form>
  );
}
