"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteShoot } from "@/app/(dashboard)/shoots/[id]/actions";

export function DeleteShootButton({
  shootId,
  shootName,
}: {
  shootId: string;
  shootName: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Delete "${shootName}"? This permanently removes its roster, gallery photos, and shot logs. Invoices and quotes already sent stay in place but lose the link to this shoot. This can't be undone.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteShoot(shootId);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button variant="destructive" disabled={pending} onClick={handleClick}>
      <Trash2 className="size-4" />
      Delete shoot
    </Button>
  );
}
