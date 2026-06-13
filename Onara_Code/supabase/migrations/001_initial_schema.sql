-- Onara initial Supabase schema.
-- Phase 5 scope: extensions, custom types, core tables, column constraints, and indexes.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'plan_type') then
    create type public.plan_type as enum ('free', 'starter', 'pro');
  end if;

  if not exists (select 1 from pg_type where typname = 'site_status') then
    create type public.site_status as enum (
      'queued',
      'generating',
      'deploying',
      'live',
      'failed',
      'suspended'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'agent_phase') then
    create type public.agent_phase as enum (
      'analyst',
      'content_writer',
      'style_agent',
      'planner',
      'prompt_engineer',
      'code_generator',
      'debugger',
      'seo_agent',
      'qa_agent',
      'mobile_agent',
      'deploying',
      'done',
      'error'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'revision_type') then
    create type public.revision_type as enum (
      'initial_generation',
      'user_revision',
      'system_refresh'
    );
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  plan public.plan_type not null default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  is_trial boolean not null default true,
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  revisions_used integer not null default 0 check (revisions_used >= 0),
  revisions_limit integer not null default 3 check (revisions_limit = -1 or revisions_limit >= 0),
  revisions_reset_at timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  show_url boolean not null default true,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  business_address text,
  business_phone text,
  business_email text,
  business_website text,
  business_hours jsonb,
  business_photos text[],
  business_category text,
  google_place_id text,
  google_rating numeric(2,1) check (google_rating is null or (google_rating >= 0 and google_rating <= 5)),
  google_review_count integer check (google_review_count is null or google_review_count >= 0),
  style_preferences jsonb,
  status public.site_status not null default 'queued',
  current_agent public.agent_phase,
  error_message text,
  generation_ms integer check (generation_ms is null or generation_ms >= 0),
  cloudflare_project_name text unique,
  public_url text,
  custom_domain text,
  github_path text,
  storage_bucket_path text,
  seo_title text,
  seo_description text,
  seo_keywords text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_deployed_at timestamptz
);

create table if not exists public.pipeline_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  job_type public.revision_type not null default 'initial_generation',
  phase public.agent_phase not null default 'analyst',
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  agents_completed integer not null default 0 check (agents_completed >= 0),
  agents_total integer not null default 10 check (agents_total > 0),
  progress_log jsonb[] not null default '{}',
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  error_agent public.agent_phase,
  error_message text,
  retry_count integer not null default 0 check (retry_count >= 0),
  created_at timestamptz not null default now(),
  check (agents_completed <= agents_total)
);

create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  pipeline_job_id uuid references public.pipeline_jobs(id) on delete set null,
  instruction text not null,
  affected_components text[],
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.pipeline_errors (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.pipeline_jobs(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  active_agent public.agent_phase,
  error_type text,
  error_message text not null,
  blackboard_snapshot jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.gbp_sync_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  field_changed text not null,
  old_value text,
  new_value text,
  auto_deployed boolean not null default false,
  notification_sent boolean not null default false,
  detected_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  data jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_stripe_customer on public.users(stripe_customer_id);
create index if not exists idx_users_plan on public.users(plan);
create index if not exists idx_users_trial_ends on public.users(trial_ends_at) where is_trial = true;
create index if not exists idx_users_revisions_reset on public.users(revisions_reset_at);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_place_id on public.projects(google_place_id);
create index if not exists idx_projects_cloudflare on public.projects(cloudflare_project_name);

create index if not exists idx_jobs_project_id on public.pipeline_jobs(project_id);
create index if not exists idx_jobs_user_id on public.pipeline_jobs(user_id);
create index if not exists idx_jobs_status on public.pipeline_jobs(status)
  where status in ('queued', 'running');

create index if not exists idx_revisions_project_id on public.revisions(project_id);
create index if not exists idx_revisions_user_id on public.revisions(user_id);

create index if not exists idx_errors_job_id on public.pipeline_errors(job_id);
create index if not exists idx_errors_created on public.pipeline_errors(created_at desc);

create index if not exists idx_gbp_sync_log_project_id on public.gbp_sync_log(project_id);
create index if not exists idx_gbp_sync_log_detected_at on public.gbp_sync_log(detected_at desc);

create index if not exists idx_stripe_events_processed on public.stripe_events(processed)
  where processed = false;
