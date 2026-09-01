-- Lets a quote justify its price: a personalized cover message up top, and
-- a short "what's included / why" note under each line item.
alter table quotes add column intro_message text;
alter table quote_items add column detail text;
