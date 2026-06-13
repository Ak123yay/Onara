-- Onara row level security policies.
-- Phase 6 scope: enable RLS and isolate user-owned data.

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.pipeline_jobs enable row level security;
alter table public.revisions enable row level security;
alter table public.pipeline_errors enable row level security;
alter table public.gbp_sync_log enable row level security;
alter table public.stripe_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users_select_own'
  ) then
    create policy "users_select_own" on public.users
      for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'users_update_own'
  ) then
    create policy "users_update_own" on public.users
      for update using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_select_own'
  ) then
    create policy "projects_select_own" on public.projects
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_insert_own'
  ) then
    create policy "projects_insert_own" on public.projects
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_update_own'
  ) then
    create policy "projects_update_own" on public.projects
      for update using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_delete_own'
  ) then
    create policy "projects_delete_own" on public.projects
      for delete using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pipeline_jobs' and policyname = 'jobs_select_own'
  ) then
    create policy "jobs_select_own" on public.pipeline_jobs
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revisions' and policyname = 'revisions_select_own'
  ) then
    create policy "revisions_select_own" on public.revisions
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revisions' and policyname = 'revisions_insert_own'
  ) then
    create policy "revisions_insert_own" on public.revisions
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'pipeline_errors' and policyname = 'errors_select_own'
  ) then
    create policy "errors_select_own" on public.pipeline_errors
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gbp_sync_log' and policyname = 'gbp_select_own'
  ) then
    create policy "gbp_select_own" on public.gbp_sync_log
      for select using (
        exists (
          select 1
          from public.projects
          where projects.id = gbp_sync_log.project_id
            and projects.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'stripe_events' and policyname = 'stripe_events_deny_all'
  ) then
    create policy "stripe_events_deny_all" on public.stripe_events
      for all using (false)
      with check (false);
  end if;
end $$;
