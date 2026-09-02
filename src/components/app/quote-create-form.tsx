"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createQuote } from "@/app/(dashboard)/quotes/new/actions";
import { dollarsToCents } from "@/lib/money";
import {
  LineItemsEditor,
  EMPTY_LINE_ITEM_ROW,
  type LineItemRow,
} from "@/components/app/line-items-editor";
import type { Client, Shoot } from "@/lib/types";

export function QuoteCreateForm({
  clients,
  shoots,
  defaultClientId,
}: {
  clients: Client[];
  shoots: Shoot[];
  defaultClientId?: string;
}) {
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [shootId, setShootId] = useState<string>("");
  const [expiresDate, setExpiresDate] = useState("");
  const [introMessage, setIntroMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<LineItemRow[]>([{ ...EMPTY_LINE_ITEM_ROW }]);
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);

  async function handleSubmit() {
    if (!clientId) {
      toast.error("Choose a client.");
      return;
    }
    setSubmitting(true);
    const result = await createQuote({
      clientId,
      shootId: shootId || null,
      expiresDate: expiresDate || null,
      introMessage: introMessage || null,
      notes: notes || null,
      items: rows.map((r) => ({
        description: r.description.trim(),
        detail: (r.detail ?? "").trim() || null,
        quantity: Number.parseInt(r.quantity, 10) || 1,
        unit_price_cents: dollarsToCents(r.unitPrice || "0"),
      })),
      sendEmail: sendEmail && !!selectedClient?.email,
    });
    setSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
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
            <Select value={shootId} onValueChange={(v) => setShootId(v ?? "")}>
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
            <Label htmlFor="expires_date">Expires (optional)</Label>
            <Input
              id="expires_date"
              type="date"
              value={expiresDate}
              onChange={(e) => setExpiresDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="intro">
            Introduce the shoot and why this quote is priced the way it is
          </Label>
          <Textarea
            id="intro"
            value={introMessage}
            onChange={(e) => setIntroMessage(e.target.value)}
            placeholder="Hi [Client] — thanks for the chance to shoot your team's photo day. Here's what I'd propose, based on a squad of ~120 athletes across 4 sports..."
            className="min-h-24"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LineItemsEditor rows={rows} onChange={setRows} showDetail />

          <div className="space-y-2 pt-2">
            <Label htmlFor="notes">Terms &amp; payment details (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="50% deposit due at booking, balance due on delivery. Quote valid for 14 days. Usage rights, reschedule policy, etc."
              className="min-h-20"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={sendEmail}
            onCheckedChange={(v) => setSendEmail(v === true)}
            disabled={!selectedClient?.email}
          />
          <Mail className="size-4" />
          {selectedClient && !selectedClient.email
            ? "Email this quote — add an email to this client first"
            : "Email this quote to the client immediately"}
        </label>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Create quote
        </Button>
      </div>
    </div>
  );
}
