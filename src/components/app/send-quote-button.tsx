"use client";

import { useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { emailQuoteToClient } from "@/app/(dashboard)/quotes/[id]/actions";
import type { QuoteStatus } from "@/lib/types";

export function SendQuoteButton({
  quoteId,
  status,
}: {
  quoteId: string;
  status: QuoteStatus;
}) {
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      const result = await emailQuoteToClient(quoteId);
      if (result.error) toast.error(result.error);
      else toast.success("Quote emailed to the client.");
    });
  }

  return (
    <Button disabled={pending} onClick={send}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      {status === "draft" ? "Email quote to client" : "Resend quote email"}
    </Button>
  );
}
