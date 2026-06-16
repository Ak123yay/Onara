-- Phase 23 revision runtime state and finite-plan monthly reset.

alter table public.revisions
  add column if not exists started_at timestamptz,
  add column if not exists error_message text,
  add column if not exists result_public_url text,
  add column if not exists github_commit_sha text,
  add column if not exists cloudflare_deployment_url text,
  add column if not exists charged_at timestamptz,
  add column if not exists progress_log jsonb not null default '[]'::jsonb;

create index if not exists idx_revisions_status on public.revisions(status);
create index if not exists idx_revisions_pipeline_job_id on public.revisions(pipeline_job_id)
  where pipeline_job_id is not null;

create or replace function public.consume_revision_credit(p_user_id uuid)
returns table(revisions_used integer, revisions_limit integer)
language sql
security definer
set search_path = public
as $$
  update public.users
  set revisions_used = case
    when users.revisions_limit = -1 then users.revisions_used
    else users.revisions_used + 1
  end
  where users.id = p_user_id
  returning users.revisions_used, users.revisions_limit;
$$;

revoke all on function public.consume_revision_credit(uuid) from public;
revoke all on function public.consume_revision_credit(uuid) from anon;
revoke all on function public.consume_revision_credit(uuid) from authenticated;
grant execute on function public.consume_revision_credit(uuid) to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'reset-free-revisions') then
    perform cron.unschedule('reset-free-revisions');
  end if;

  if exists (select 1 from cron.job where jobname = 'reset-finite-revisions') then
    perform cron.unschedule('reset-finite-revisions');
  end if;
end $$;

select cron.schedule(
  'reset-finite-revisions',
  '0 0 1 * *',
  $$
    update public.users
    set
      revisions_used = 0,
      revisions_reset_at = date_trunc('month', now()) + interval '1 month'
    where revisions_limit <> -1;
  $$
);
