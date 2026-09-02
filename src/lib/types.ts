export type ShootStatus = "upcoming" | "active" | "completed";

export type Shoot = {
  id: string;
  school_name: string;
  shoot_date: string; // date, ISO yyyy-mm-dd
  location: string | null;
  status: ShootStatus;
  created_at: string;
};

export type StudentStatus = "pending" | "photographed" | "no_show" | "redo";

export type Student = {
  id: string;
  shoot_id: string;
  shoot_number: number;
  full_name: string;
  grade_or_teacher: string | null;
  student_id: string | null;
  status: StudentStatus;
  photographed_at: string | null;
  created_at: string;
};

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  pending: "Pending",
  photographed: "Photographed",
  no_show: "No-show",
  redo: "Redo needed",
};

export type SproutEventType =
  | "new_lead"
  | "lead_status_change"
  | "new_shoot"
  | "payment_made";

export const SPROUT_EVENT_LABELS: Record<SproutEventType, string> = {
  new_lead: "New lead",
  lead_status_change: "Lead status changed",
  new_shoot: "New shoot created",
  payment_made: "Payment made",
};

export type SproutEvent = {
  id: string;
  event_type: SproutEventType;
  payload: Record<string, unknown>;
  received_at: string;
};

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  stripe_customer_id: string | null;
  created_at: string;
};

export type InvoiceStatus = "unpaid" | "paid" | "void";

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  void: "Void",
};

export type Invoice = {
  id: string;
  invoice_number: string;
  client_id: string;
  shoot_id: string | null;
  student_id: string | null;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  total_cents: number;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_hosted_invoice_url: string | null;
  created_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  sort_order: number;
};

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};

export type Quote = {
  id: string;
  quote_number: string;
  client_id: string;
  shoot_id: string | null;
  status: QuoteStatus;
  issue_date: string;
  expires_date: string | null;
  intro_message: string | null;
  notes: string | null;
  total_cents: number;
  accepted_invoice_id: string | null;
  created_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  description: string;
  detail: string | null;
  quantity: number;
  unit_price_cents: number;
  sort_order: number;
};

export type Photo = {
  id: string;
  shoot_id: string;
  student_id: string | null;
  original_path: string;
  preview_path: string;
  original_filename: string | null;
  sort_order: number;
  created_at: string;
};

export type GalleryOrderStatus = "pending" | "paid";

export type GalleryOrder = {
  id: string;
  shoot_id: string;
  client_id: string | null;
  package_id: string;
  total_cents: number;
  status: GalleryOrderStatus;
  invoice_id: string | null;
  created_at: string;
};

export type GalleryOrderItem = {
  id: string;
  order_id: string;
  photo_id: string;
  print_size: string;
  slot_index: number;
};
