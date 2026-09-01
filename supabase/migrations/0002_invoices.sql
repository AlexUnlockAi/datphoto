-- Dat Photo Command Center — invoicing
-- Run this in the Supabase SQL editor after 0001_init.sql.

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);
create index clients_name_idx on clients (lower(name));

create sequence invoice_number_seq start 1001;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || nextval('invoice_number_seq')::text),
  client_id uuid not null references clients (id) on delete restrict,
  shoot_id uuid references shoots (id) on delete set null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'void')),
  issue_date date not null default current_date,
  due_date date,
  notes text,
  total_cents int not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index invoices_client_idx on invoices (client_id);
create index invoices_status_idx on invoices (status);
create index invoices_created_idx on invoices (created_at desc);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  description text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  sort_order int not null default 0
);
create index invoice_items_invoice_idx on invoice_items (invoice_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

create policy "admin full access clients" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access invoices" on invoices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access invoice_items" on invoice_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- No public/anon policy: the shareable invoice link (/i/[id]) is a server
-- component that reads with the service-role client, scoped to the one
-- invoice id in the URL. Adding an anon "select using (true)" policy here
-- would let anyone with the public anon key list every invoice in the
-- table via the REST API, not just the one they were sent — deliberately
-- avoided.
