import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<InvoiceStatus, string> = {
  unpaid: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  void: "bg-muted text-muted-foreground border-border",
};

export function InvoiceStatusBadge({
  status,
  overdue,
}: {
  status: InvoiceStatus;
  overdue?: boolean;
}) {
  if (overdue && status === "unpaid") {
    return (
      <Badge className="border-red-500/30 bg-red-500/10 text-red-400">Overdue</Badge>
    );
  }
  return (
    <Badge className={cn(STYLES[status])}>{INVOICE_STATUS_LABELS[status]}</Badge>
  );
}
