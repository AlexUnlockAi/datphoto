-- Dat Photo Command Center — core schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

create table shoots (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  shoot_date date not null,
  location text,
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  created_at timestamptz not null default now()
);
create index shoots_date_idx on shoots (shoot_date desc);

create table students (
  id uuid primary key default gen_random_uuid(),
  shoot_id uuid not null references shoots (id) on delete cascade,
  shoot_number int not null,
  full_name text not null,
  grade_or_teacher text,
  student_id text,
  status text not null default 'pending' check (status in ('pending', 'photographed', 'no_show', 'redo')),
  photographed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shoot_id, shoot_number)
);
create index students_shoot_idx on students (shoot_id, shoot_number);

create table sprout_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('new_lead', 'lead_status_change', 'new_shoot', 'payment_made')),
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);
create index sprout_events_received_idx on sprout_events (received_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table shoots enable row level security;
alter table students enable row level security;
alter table sprout_events enable row level security;

-- Authenticated (the single admin user) has full access to the app data.
create policy "admin full access shoots" on shoots
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access students" on students
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access sprout_events" on sprout_events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- No anon policies: the Sprout webhook route writes with the service-role
-- key (see src/lib/supabase/service.ts), which bypasses RLS entirely and is
-- gated by SPROUT_WEBHOOK_TOKEN in the route handler instead.
