import type { SproutEventType } from "@/lib/types";

export const SPROUT_EVENT_TYPES: SproutEventType[] = [
  "new_lead",
  "lead_status_change",
  "new_shoot",
  "payment_made",
];

export function isSproutEventType(value: string): value is SproutEventType {
  return (SPROUT_EVENT_TYPES as string[]).includes(value);
}

// Zapier's exact field names depend on how each Zap maps Sprout's fields, so
// this is a best-effort scan across common key spellings rather than a fixed
// schema — the raw payload is always stored alongside this summary too.
function firstValue(
  payload: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const match = Object.keys(payload).find(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    if (match && payload[match] != null && payload[match] !== "") {
      return String(payload[match]);
    }
  }
  return null;
}

export function summarizeSproutEvent(
  eventType: SproutEventType,
  payload: Record<string, unknown>
): string {
  const name = firstValue(payload, [
    "name",
    "client_name",
    "lead_name",
    "customer_name",
    "full_name",
  ]);
  const amount = firstValue(payload, ["amount", "payment_amount", "total"]);
  const status = firstValue(payload, ["status", "lead_status", "new_status"]);
  const shootName = firstValue(payload, ["shoot_name", "shoot_title", "title"]);

  switch (eventType) {
    case "new_lead":
      return name ? `New lead: ${name}` : "New lead received";
    case "lead_status_change":
      return name
        ? `${name} → ${status ?? "status changed"}`
        : `Lead status changed${status ? `: ${status}` : ""}`;
    case "new_shoot":
      return shootName ? `New shoot: ${shootName}` : "New shoot created";
    case "payment_made":
      return amount
        ? `Payment received: $${amount}${name ? ` (${name})` : ""}`
        : `Payment received${name ? ` (${name})` : ""}`;
  }
}
