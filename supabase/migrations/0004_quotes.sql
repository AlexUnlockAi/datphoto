-- Dat Photo Command Center — quotes, and linking invoices to a specific student
-- Run this in the Supabase SQL editor after 0003_stripe.sql.

alter table invoices
  add column student_id uuid references students (id) on delete set null;

create sequence quote_number_seq start 1001;

create table quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default ('Q-' || nextval('quote_number_seq')::text),
  client_id uuid not null references clients (id) on delete restrict,
  shoot_id uuid references shoots (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  issue_date date not null default current_date,
  expires_date date,
  notes text,
  total_cents int not null default 0,
  accepted_invoice_id uuid references invoices (id) on delete set null,
  created_at timestamptz not null default now()
);
create index quotes_client_idx on quotes (client_id);
create index quotes_status_idx on quotes (status);
create index quotes_created_idx on quotes (created_at desc);

create table quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  description text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  sort_order int not null default 0
);
create index quote_items_quote_idx on quote_items (quote_id);

alter table quotes enable row level security;
alter table quote_items enable row level security;

create policy "admin full access quotes" on quotes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access quote_items" on quote_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- No anon policy on quotes: the public quote link (/q/[id]) and its accept
-- action read/write with the service-role client, same reasoning as
-- invoices (see 0002_invoices.sql).
