"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoice } from "@/app/(dashboard)/invoices/new/actions";
import { dollarsToCents } from "@/lib/money";
import {
  LineItemsEditor,
  EMPTY_LINE_ITEM_ROW,
  type LineItemRow,
} from "@/components/app/line-items-editor";
import type { Client, Shoot, Student } from "@/lib/types";

export function InvoiceCreateForm({
  clients,
  shoots,
  students,
  defaultClientId,
}: {
  clients: Client[];
  shoots: Shoot[];
  students: Student[];
  defaultClientId?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [shootId, setShootId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<LineItemRow[]>([{ ...EMPTY_LINE_ITEM_ROW }]);
  const [submitting, setSubmitting] = useState(false);

  const studentsForShoot = shootId ? students.filter((s) => s.shoot_id === shootId) : [];

  async function handleSubmit() {
    if (!clientId) {
      toast.error("Choose a client.");
      return;
    }
    setSubmitting(true);
    const result = await createInvoice({
      clientId,
      shootId: shootId || null,
      studentId: studentId || null,
      dueDate: dueDate || null,
      notes: notes || null,
      items: rows.map((r) => ({
        description: r.description.trim(),
        quantity: Number.parseInt(r.quantity, 10) || 1,
        unit_price_cents: dollarsToCents(r.unitPrice || "0"),
      })),
    });
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
    }
    // On success the action redirects, so no further handling needed here.
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Related shoot (optional)</Label>
            <Select
              value={shootId}
              onValueChange={(v) => {
                setShootId(v ?? "");
                setStudentId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {shoots.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.school_name} — {s.shoot_date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Student (optional)</Label>
            <Select
              value={studentId}
              onValueChange={(v) => setStudentId(v ?? "")}
              disabled={!shootId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={shootId ? "None" : "Pick a shoot first"} />
              </SelectTrigger>
              <SelectContent>
                {studentsForShoot.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    #{s.shoot_number} {s.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Due date (optional)</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LineItemsEditor rows={rows} onChange={setRows} />

          <div className="space-y-2 pt-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment via check or Zelle to..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Create invoice
        </Button>
      </div>
    </div>
  );
}
