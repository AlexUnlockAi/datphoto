"use client";

import { useTransition } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setQuoteStatus } from "@/app/(dashboard)/quotes/[id]/actions";
import type { QuoteStatus } from "@/lib/types";

export function QuoteStatusToggle({
  quoteId,
  status,
}: {
  quoteId: string;
  status: QuoteStatus;
}) {
  const [pending, startTransition] = useTransition();

  function set(next: QuoteStatus) {
    startTransition(async () => {
      const result = await setQuoteStatus(quoteId, next);
      if (result.error) toast.error(result.error);
      else toast.success(`Marked ${next}.`);
    });
  }

  if (status === "accepted" || status === "declined") return null;

  return (
    <Button variant="outline" disabled={pending} onClick={() => set("declined")}>
      <Ban className="size-4" />
      Mark declined
    </Button>
  );
}
