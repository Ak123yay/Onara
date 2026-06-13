-- Scheduled database maintenance jobs.
-- Requires pg_cron to be enabled in the Supabase project.

create extension if not exists pg_cron;
grant usage on schema cron to postgres;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'reset-free-revisions') then
    perform cron.unschedule('reset-free-revisions');
  end if;

  if exists (select 1 from cron.job where jobname = 'downgrade-expired-trials') then
    perform cron.unschedule('downgrade-expired-trials');
  end if;

  if exists (select 1 from cron.job where jobname = 'suspend-failed-payment-sites') then
    perform cron.unschedule('suspend-failed-payment-sites');
  end if;

  if exists (select 1 from cron.job where jobname = 'cleanup-pipeline-errors') then
    perform cron.unschedule('cleanup-pipeline-errors');
  end if;
end $$;

select cron.schedule(
  'reset-free-revisions',
  '0 0 1 * *',
  $$
    update public.users
    set
      revisions_used = 0,
      revisions_reset_at = date_trunc('month', now()) + interval '1 month'
    where plan = 'free';
  $$
);

select cron.schedule(
  'downgrade-expired-trials',
  '0 2 * * *',
  $$
    update public.users
    set
      plan = 'free',
      is_trial = false,
      show_url = false,
      revisions_limit = 3,
      revisions_used = 0
    where is_trial = true
      and trial_ends_at < now();
  $$
);

select cron.schedule(
  'suspend-failed-payment-sites',
  '0 3 * * *',
  $$
    update public.projects p
    set status = 'suspended'
    from public.users u
    where p.user_id = u.id
      and u.subscription_status = 'past_due'
      and p.status = 'live';
  $$
);

select cron.schedule(
  'cleanup-pipeline-errors',
  '0 4 * * 0',
  $$
    delete from public.pipeline_errors
    where created_at < now() - interval '30 days';
  $$
);
