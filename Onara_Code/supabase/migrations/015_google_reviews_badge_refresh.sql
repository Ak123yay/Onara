-- Phase 26: weekly Google reviews badge refresh.
-- Pulls current rating/count from Places API and refreshes the marked badge on live sites.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists vault;
create extension if not exists supabase_vault with schema vault;

alter table public.projects
  add column if not exists google_reviews_refreshed_at timestamptz,
  add column if not exists google_reviews_refresh_error text;

create index if not exists idx_projects_reviews_refresh_candidates
  on public.projects(status, google_reviews_refreshed_at)
  where google_place_id is not null;

create or replace function public.invoke_refresh_reviews_edge_function()
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
    raise exception 'Missing Vault secrets project_url and cron_secret for refresh-reviews schedule';
  end if;

  select net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/refresh-reviews',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object(
      'source', 'pg_cron',
      'scheduled_at', now(),
      'limit', 100
    )
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_refresh_reviews_edge_function() from public;
revoke all on function public.invoke_refresh_reviews_edge_function() from anon;
revoke all on function public.invoke_refresh_reviews_edge_function() from authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'refresh-google-reviews-badges') then
    perform cron.unschedule('refresh-google-reviews-badges');
  end if;
end $$;

select cron.schedule(
  'refresh-google-reviews-badges',
  '0 5 * * 0',
  $$ select public.invoke_refresh_reviews_edge_function(); $$
);
