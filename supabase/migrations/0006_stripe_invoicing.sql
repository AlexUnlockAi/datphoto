-- Dat Photo Command Center — real Stripe Invoicing (not just Checkout)
-- Run this in the Supabase SQL editor after 0005_gallery.sql.

alter table clients add column stripe_customer_id text;
alter table invoices add column stripe_invoice_id text;
alter table invoices add column stripe_hosted_invoice_url text;
