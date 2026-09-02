"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConvertQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      "Convert this quote straight to an invoice? Use this when the client agreed by phone or in person — no need to wait for them to click Accept online."
    );
    if (!confirmed) return;

    setPending(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/accept`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? "Could not convert this quote.");
        setPending(false);
        return;
      }
      router.push(new URL(res.url).pathname);
    } catch {
      toast.error("Network error — could not convert this quote.");
      setPending(false);
    }
  }

  return (
    <Button variant="outline" disabled={pending} onClick={handleClick}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
      Convert to invoice now
    </Button>
  );
}
