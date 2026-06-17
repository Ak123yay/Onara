-- Phase 24 reverse-trial lifecycle.
-- New users get 14 days of Pro access; a daily scheduled Edge Function downgrades expired trials.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists vault with schema vault;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    avatar_url,
    plan,
    is_trial,
    trial_ends_at,
    revisions_limit,
    revisions_used,
    show_url
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'pro',
    true,
    now() + interval '14 days',
    -1,
    0,
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.users.full_name, excluded.full_name),
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.downgrade_expired_trials()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  downgraded_count integer;
begin
  update public.users
  set
    plan = 'free',
    is_trial = false,
    subscription_status = null,
    show_url = false,
    revisions_limit = 3,
    revisions_used = 0,
    revisions_reset_at = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
  where is_trial = true
    and trial_ends_at <= now()
    and stripe_subscription_id is null;

  get diagnostics downgraded_count = row_count;
  return downgraded_count;
end;
$$;

revoke all on function public.downgrade_expired_trials() from public;
revoke all on function public.downgrade_expired_trials() from anon;
revoke all on function public.downgrade_expired_trials() from authenticated;
grant execute on function public.downgrade_expired_trials() to service_role;

create or replace function public.invoke_downgrade_trials_edge_function()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  cron_secret text;
  project_url text;
  request_id bigint;
begin
  select decrypted_secret
  into project_url
  from vault.decrypted_secrets
  where name = 'project_url'
  order by updated_at desc
  limit 1;

  select decrypted_secret
  into cron_secret
  from vault.decrypted_secrets
  where name = 'cron_secret'
  order by updated_at desc
  limit 1;

  if project_url is null or cron_secret is null then
    raise exception 'Missing Vault secrets project_url and cron_secret for downgrade-trials schedule';
  end if;

  select net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/downgrade-trials',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'scheduled_at', now()
    )
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_downgrade_trials_edge_function() from public;
revoke all on function public.invoke_downgrade_trials_edge_function() from anon;
revoke all on function public.invoke_downgrade_trials_edge_function() from authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'downgrade-expired-trials') then
    perform cron.unschedule('downgrade-expired-trials');
  end if;
end $$;

select cron.schedule(
  'downgrade-expired-trials',
  '0 2 * * *',
  $$ select public.invoke_downgrade_trials_edge_function(); $$
);
