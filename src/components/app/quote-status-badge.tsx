import { Badge } from "@/components/ui/badge";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<QuoteStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  declined: "bg-red-500/10 text-red-400 border-red-500/30",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge className={cn(STYLES[status])}>{QUOTE_STATUS_LABELS[status]}</Badge>
  );
}
