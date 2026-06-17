-- Phase 24 billing lifecycle state synced from Stripe subscriptions.

alter table public.users
  add column if not exists subscription_current_period_end timestamptz;

create index if not exists idx_users_subscription_current_period_end
  on public.users(subscription_current_period_end)
  where subscription_current_period_end is not null;
