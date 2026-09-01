"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents, dollarsToCents } from "@/lib/money";

export type LineItemRow = { description: string; quantity: string; unitPrice: string };

export const EMPTY_LINE_ITEM_ROW: LineItemRow = {
  description: "",
  quantity: "1",
  unitPrice: "",
};

export function lineItemsTotalCents(rows: LineItemRow[]): number {
  return rows.reduce((sum, r) => {
    const qty = Number.parseInt(r.quantity, 10) || 0;
    return sum + qty * dollarsToCents(r.unitPrice || "0");
  }, 0);
}

export function LineItemsEditor({
  rows,
  onChange,
}: {
  rows: LineItemRow[];
  onChange: (rows: LineItemRow[]) => void;
}) {
  function updateRow(i: number, patch: Partial<LineItemRow>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_5rem_7rem_2rem] items-end gap-2">
          <div className="space-y-1">
            {i === 0 && <Label className="text-xs">Description</Label>}
            <Input
              value={row.description}
              onChange={(e) => updateRow(i, { description: e.target.value })}
              placeholder="Sitting fee"
            />
          </div>
          <div className="space-y-1">
            {i === 0 && <Label className="text-xs">Qty</Label>}
            <Input
              type="number"
              min={1}
              value={row.quantity}
              onChange={(e) => updateRow(i, { quantity: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            {i === 0 && <Label className="text-xs">Price</Label>}
            <Input
              type="number"
              min={0}
              step="0.01"
              value={row.unitPrice}
              onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            disabled={rows.length === 1}
            aria-label="Remove line"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, { ...EMPTY_LINE_ITEM_ROW }])}
      >
        <Plus className="size-4" />
        Add line
      </Button>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-heading text-2xl text-primary">
          {formatCents(lineItemsTotalCents(rows))}
        </span>
      </div>
    </div>
  );
}
