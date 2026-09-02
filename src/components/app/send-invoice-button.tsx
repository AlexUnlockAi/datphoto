"use client";

import { useTransition } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { emailInvoiceToClient } from "@/app/(dashboard)/invoices/[id]/actions";

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();

  function send() {
    startTransition(async () => {
      const result = await emailInvoiceToClient(invoiceId);
      if (result.error) toast.error(result.error);
      else toast.success("Invoice emailed to the client.");
    });
  }

  return (
    <Button variant="outline" disabled={pending} onClick={send}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      Email invoice
    </Button>
  );
}
