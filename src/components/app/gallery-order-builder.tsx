"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCents } from "@/lib/money";
import {
  PACKAGES,
  INDIVIDUAL_PRICES_CENTS,
  packageSlotList,
  type PrintSize,
} from "@/lib/packages";

type GalleryPhoto = { id: string; url: string };

type PickerTarget =
  | { mode: "package"; slotKey: string }
  | { mode: "custom"; index: number };

export function GalleryOrderBuilder({
  shootId,
  photos,
}: {
  shootId: string;
  photos: GalleryPhoto[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"package" | "custom">("package");
  const [packageId, setPackageId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [customItems, setCustomItems] = useState<
    { size: PrintSize; photoId: string | null }[]
  >([]);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const photosById = new Map(photos.map((p) => [p.id, p]));
  const pkg = PACKAGES.find((p) => p.id === packageId) ?? null;
  const slots = pkg ? packageSlotList(pkg) : [];

  function selectPackage(id: string) {
    setPackageId(id);
    setAssignments({});
  }

  function pickPhoto(photoId: string) {
    if (!picker) return;
    if (picker.mode === "package") {
      setAssignments((prev) => ({ ...prev, [picker.slotKey]: photoId }));
    } else {
      setCustomItems((prev) =>
        prev.map((item, i) => (i === picker.index ? { ...item, photoId } : item))
      );
    }
    setPicker(null);
  }

  const packageComplete = pkg !== null && slots.every((s) => assignments[s.key]);
  const customTotalCents = customItems.reduce(
    (sum, item) => sum + INDIVIDUAL_PRICES_CENTS[item.size],
    0
  );
  const customComplete = customItems.length > 0 && customItems.every((i) => i.photoId);

  const ready =
    (tab === "package" ? packageComplete : customComplete) &&
    name.trim().length > 0 &&
    email.trim().length > 0;

  async function checkout() {
    setSubmitting(true);
    try {
      const body =
        tab === "package"
          ? {
              shootId,
              name,
              email,
              mode: "package" as const,
              packageId: pkg!.id,
              assignments: slots.map((s) => ({
                size: s.size,
                slotIndex: s.slotIndex,
                photoId: assignments[s.key],
              })),
            }
          : {
              shootId,
              name,
              email,
              mode: "custom" as const,
              items: customItems.map((i) => ({ size: i.size, photoId: i.photoId })),
            };

      const res = await fetch("/api/gallery-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not start checkout");
        setSubmitting(false);
        return;
      }
      router.push(`/i/${data.invoiceId}`);
    } catch {
      toast.error("Network error — could not start checkout");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-14 border-t border-border pt-10">
      <p className="text-xs tracking-[0.15em] text-muted-foreground uppercase">Order prints</p>
      <h2 className="mt-1 font-heading text-xl">Choose a package or build your own</h2>

      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setTab("package")}
          className={`border px-4 py-2 text-sm font-medium transition-colors ${
            tab === "package"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Packages
        </button>
        <button
          onClick={() => setTab("custom")}
          className={`border px-4 py-2 text-sm font-medium transition-colors ${
            tab === "custom"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Individual prints
        </button>
      </div>

      {tab === "package" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPackage(p.id)}
              className={`border p-4 text-left transition-colors ${
                packageId === p.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <p className="font-heading text-lg">{p.name}</p>
              <p className="font-heading text-2xl text-primary">{formatCents(p.priceCents)}</p>
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {p.slots.map((s) => (
                  <li key={s.size}>
                    {s.count}x {s.size} print
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {customItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 border border-border p-3">
              <Select
                value={item.size}
                onValueChange={(v) =>
                  setCustomItems((prev) =>
                    prev.map((it, idx) => (idx === i ? { ...it, size: v as PrintSize } : it))
                  )
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(INDIVIDUAL_PRICES_CENTS) as PrintSize[]).map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} — {formatCents(INDIVIDUAL_PRICES_CENTS[size])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {item.photoId ? (
                <button
                  onClick={() => setPicker({ mode: "custom", index: i })}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photosById.get(item.photoId)?.url}
                    alt=""
                    className="size-10 object-cover"
                  />
                  Change photo
                </button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPicker({ mode: "custom", index: i })}
                >
                  Choose photo
                </Button>
              )}

              <button
                onClick={() => setCustomItems((prev) => prev.filter((_, idx) => idx !== i))}
                className="ml-auto text-muted-foreground hover:text-foreground"
                aria-label="Remove"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomItems((prev) => [...prev, { size: "4x5", photoId: null }])}
          >
            <Plus className="size-4" />
            Add a print
          </Button>

          {customItems.length > 0 && (
            <p className="pt-2 text-sm text-muted-foreground">
              Total: <span className="font-medium text-primary">{formatCents(customTotalCents)}</span>
            </p>
          )}
        </div>
      )}

      {tab === "package" && pkg && (
        <div className="mt-6 space-y-2">
          {slots.map((slot) => {
            const photoId = assignments[slot.key];
            return (
              <div key={slot.key} className="flex items-center gap-3 border border-border p-3">
                <span className="w-28 shrink-0 text-sm font-medium">
                  {slot.size} #{slot.slotIndex + 1}
                </span>
                {photoId ? (
                  <button
                    onClick={() => setPicker({ mode: "package", slotKey: slot.key })}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photosById.get(photoId)?.url} alt="" className="size-10 object-cover" />
                    Change photo
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPicker({ mode: "package", slotKey: slot.key })}
                  >
                    Choose photo
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {((tab === "package" && packageComplete) || (tab === "custom" && customComplete)) && (
        <Card className="mt-6 max-w-md">
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="order-name">Name</Label>
              <Input id="order-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="order-email">Email</Label>
              <Input
                id="order-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button className="w-full" disabled={!ready || submitting} onClick={checkout}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Checkout —{" "}
              {formatCents(tab === "package" ? (pkg?.priceCents ?? 0) : customTotalCents)}
            </Button>
          </CardContent>
        </Card>
      )}

      {picker && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/98 p-6 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <p className="font-heading text-lg">Choose a photo</p>
              <button
                onClick={() => setPicker(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => pickPhoto(photo.id)}
                  className="aspect-square overflow-hidden border border-transparent transition-colors hover:border-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
