-- Phase 23: cache the daily dashboard brief so it only regenerates once per day.

alter table public.users
  add column if not exists dashboard_brief jsonb,
  add column if not exists dashboard_brief_generated_on date;

