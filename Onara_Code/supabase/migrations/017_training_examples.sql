-- Phase 27 training data pipeline.
-- Store only explicitly consented, QA-approved, redacted generation examples.

alter table public.users
  add column if not exists training_data_consent boolean not null default false,
  add column if not exists training_data_consent_at timestamptz,
  add column if not exists training_data_consent_version text,
  add column if not exists training_data_opted_out_at timestamptz;

create table if not exists public.training_examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  pipeline_job_id text,
  source_type text not null default 'initial_generation'
    check (source_type in ('initial_generation', 'user_revision', 'system_refresh')),
  example_kind text not null default 'generated_site',
  quality_gate text not null,
  consent_version text not null,
  redaction_version text not null,
  business_category text,
  industry text,
  rag_pattern_ids text[] not null default '{}',
  input_snapshot jsonb not null default '{}'::jsonb,
  prompt_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  qa_snapshot jsonb not null default '{}'::jsonb,
  content_hash text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_training_examples_user_id
  on public.training_examples(user_id);

create index if not exists idx_training_examples_project_id
  on public.training_examples(project_id);

create index if not exists idx_training_examples_created_at
  on public.training_examples(created_at desc);

alter table public.training_examples enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'training_examples' and policyname = 'training_examples_select_own'
  ) then
    create policy "training_examples_select_own" on public.training_examples
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'training_examples' and policyname = 'training_examples_delete_own'
  ) then
    create policy "training_examples_delete_own" on public.training_examples
      for delete using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.set_training_data_consent(
  p_enabled boolean,
  p_consent_version text default '2026-06-19-v1'
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
begin
  update public.users
  set
    training_data_consent = p_enabled,
    training_data_consent_at = case when p_enabled then now() else training_data_consent_at end,
    training_data_consent_version = case when p_enabled then p_consent_version else training_data_consent_version end,
    training_data_opted_out_at = case when p_enabled then null else now() end,
    updated_at = now()
  where id = auth.uid()
  returning * into updated_user;

  if updated_user.id is null then
    raise exception 'No user row found for current auth user';
  end if;

  return updated_user;
end;
$$;

revoke all on function public.set_training_data_consent(boolean, text) from public;
grant execute on function public.set_training_data_consent(boolean, text) to authenticated;
