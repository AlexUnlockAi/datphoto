-- First-class client gallery folders. Apply after 0008_gallery_orders.sql.
create table if not exists gallery_folders (
  id uuid primary key default gen_random_uuid(),
  shoot_id uuid not null references shoots(id) on delete cascade,
  name text not null,
  client_label text,
  public_token text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists gallery_folders_shoot_idx on gallery_folders(shoot_id, created_at);

alter table photos add column if not exists folder_id uuid references gallery_folders(id) on delete set null;
create index if not exists photos_folder_idx on photos(folder_id, sort_order);
alter table gallery_orders add column if not exists folder_id uuid references gallery_folders(id) on delete set null;
create index if not exists gallery_orders_folder_idx on gallery_orders(folder_id, created_at);

alter table gallery_folders enable row level security;
create policy "admin full access gallery_folders" on gallery_folders
  for all to authenticated using (true) with check (true);

-- Existing photos/orders remain valid while new folders are introduced. The app
-- creates a default folder and backfills legacy rows when the gallery is opened.
