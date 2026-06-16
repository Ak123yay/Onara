-- Phase 23 expansion: revision threads, manual component selection, diffs, and rollback snapshots.

alter table public.revisions
  add column if not exists parent_revision_id uuid references public.revisions(id) on delete set null,
  add column if not exists revision_kind text not null default 'edit' check (revision_kind in ('edit', 'rollback')),
  add column if not exists component_selection text[] not null default '{}',
  add column if not exists before_public_url text,
  add column if not exists before_cloudflare_deployment_url text,
  add column if not exists before_github_commit_sha text,
  add column if not exists before_files jsonb,
  add column if not exists after_files jsonb,
  add column if not exists changed_files jsonb not null default '[]'::jsonb,
  add column if not exists agent_summary text;

create index if not exists idx_revisions_parent_revision_id on public.revisions(parent_revision_id)
  where parent_revision_id is not null;

create table if not exists public.revision_messages (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.revisions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.revision_messages enable row level security;

revoke all on public.revision_messages from anon;
revoke all on public.revision_messages from authenticated;
grant select on public.revision_messages to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'revision_messages'
      and policyname = 'revision_messages_select_own'
  ) then
    create policy "revision_messages_select_own" on public.revision_messages
      for select using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_revision_messages_revision_id on public.revision_messages(revision_id, created_at);
create index if not exists idx_revision_messages_project_id on public.revision_messages(project_id, created_at);
