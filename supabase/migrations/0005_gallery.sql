-- Dat Photo Command Center — photo gallery
-- Run this in the Supabase SQL editor after 0004_quotes.sql.

create table photos (
  id uuid primary key default gen_random_uuid(),
  shoot_id uuid not null references shoots (id) on delete cascade,
  student_id uuid references students (id) on delete set null,
  original_path text not null,   -- path in the private `photos-original` bucket
  preview_path text not null,    -- path in the public `photos-preview` bucket (watermarked)
  original_filename text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index photos_shoot_idx on photos (shoot_id, sort_order);
create index photos_student_idx on photos (student_id);

alter table photos enable row level security;

create policy "admin full access photos" on photos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- No anon policy on the `photos` table: the public gallery (/g/[shootId]) and
-- the download route read with the service-role client, same reasoning as
-- invoices/quotes.

-- ─────────────────────────────────────────────────────────────────────────
-- Storage buckets
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values
  ('photos-original', 'photos-original', false),
  ('photos-preview', 'photos-preview', true)
on conflict (id) do nothing;

-- Originals: admin (authenticated) read/write only. No public policy at all —
-- the app hands out short-lived signed URLs after verifying payment.
create policy "admin read photos-original" on storage.objects
  for select to authenticated using (bucket_id = 'photos-original');
create policy "admin write photos-original" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos-original');
create policy "admin delete photos-original" on storage.objects
  for delete to authenticated using (bucket_id = 'photos-original');

-- Previews: public read (that's the point — watermarked images are safe to
-- expose), admin-only write.
create policy "public read photos-preview" on storage.objects
  for select using (bucket_id = 'photos-preview');
create policy "admin write photos-preview" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos-preview');
create policy "admin delete photos-preview" on storage.objects
  for delete to authenticated using (bucket_id = 'photos-preview');
