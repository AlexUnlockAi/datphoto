-- Client self-serve print-package ordering: a client on the public gallery
-- picks a package (Ultimate/Silver/Basic — defined in code, src/lib/packages.ts)
-- and assigns a specific photo to each print-size slot. Paying the resulting
-- invoice unlocks full-res download of exactly the photos they picked —
-- separate from (and additive to) the existing per-student/per-shoot
-- invoice-based unlock used for admin-created invoices.
create table gallery_orders (
  id uuid primary key default gen_random_uuid(),
  shoot_id uuid not null references shoots (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  package_id text not null,
  total_cents int not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  invoice_id uuid references invoices (id) on delete set null,
  created_at timestamptz not null default now()
);

create table gallery_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references gallery_orders (id) on delete cascade,
  photo_id uuid not null references photos (id) on delete cascade,
  print_size text not null,
  slot_index int not null
);
create index gallery_order_items_order_idx on gallery_order_items (order_id);
create index gallery_order_items_photo_idx on gallery_order_items (photo_id);

alter table gallery_orders enable row level security;
alter table gallery_order_items enable row level security;

create policy "admin full access gallery_orders" on gallery_orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access gallery_order_items" on gallery_order_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- No anon policy — the public gallery/order routes use the service-role
-- client, same reasoning as photos/invoices/quotes elsewhere.
