"use client";

import { useTransition } from "react";
import { Check, Undo2, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setInvoiceStatus } from "@/app/(dashboard)/invoices/[id]/actions";
import type { InvoiceStatus } from "@/lib/types";

export function PaymentStatusToggle({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: InvoiceStatus;
}) {
  const [pending, startTransition] = useTransition();

  function set(next: InvoiceStatus) {
    startTransition(async () => {
      const result = await setInvoiceStatus(invoiceId, next);
      if (result.error) toast.error(result.error);
      else toast.success(`Marked ${next}.`);
    });
  }

  if (status === "paid") {
    return (
      <Button variant="outline" disabled={pending} onClick={() => set("unpaid")}>
        <Undo2 className="size-4" />
        Mark unpaid
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button disabled={pending} onClick={() => set("paid")}>
        <Check className="size-4" />
        Mark paid
      </Button>
      {status !== "void" && (
        <Button variant="outline" disabled={pending} onClick={() => set("void")}>
          <Ban className="size-4" />
          Void
        </Button>
      )}
    </div>
  );
}
