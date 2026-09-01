-- Dat Photo Command Center — Stripe payment tracking
-- Run this in the Supabase SQL editor after 0002_invoices.sql.

alter table invoices
  add column stripe_checkout_session_id text,
  add column stripe_payment_intent_id text;
