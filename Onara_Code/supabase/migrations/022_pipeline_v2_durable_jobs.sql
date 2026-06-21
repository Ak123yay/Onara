-- Pipeline V2: durable leased jobs, resumable events, and candidate metadata.

alter table public.pipeline_jobs
  drop constraint if exists pipeline_jobs_status_check;

alter table public.pipeline_jobs
  add constraint pipeline_jobs_status_check
  check (status in ('queued', 'running', 'done', 'completed', 'failed'));

alter table public.pipeline_jobs
  add column if not exists pipeline_version text not null default 'v1',
  add column if not exists request_payload jsonb not null default '{}'::jsonb,
  add column if not exists request_signature text,
  add column if not exists stage text not null default 'queued',
  add column if not exists stage_state jsonb not null default '{}'::jsonb,
  add column if not exists result_summary jsonb not null default '{}'::jsonb,
  add column if not exists lease_owner text,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists heartbeat_at timestamptz,
  add column if not exists attempt integer not null default 0 check (attempt >= 0),
  add column if not exists eta_seconds integer check (eta_seconds is null or eta_seconds >= 0),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists idx_pipeline_jobs_active_signature
  on public.pipeline_jobs(user_id, request_signature)
  where status in ('queued', 'running') and request_signature is not null;

create index if not exists idx_pipeline_jobs_claim
  on public.pipeline_jobs(status, lease_expires_at, queued_at);

create table if not exists public.pipeline_job_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.pipeline_jobs(id) on delete cascade,
  sequence integer not null,
  event text not null,
  stage text,
  agent_id text,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (job_id, sequence)
);

create index if not exists idx_pipeline_job_events_job_sequence
  on public.pipeline_job_events(job_id, sequence);

create table if not exists public.pipeline_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.pipeline_jobs(id) on delete cascade,
  candidate_key text not null,
  model text not null,
  provider text not null,
  recipe text,
  artifact_html text,
  status text not null default 'generating'
    check (status in ('generating', 'validating', 'eligible', 'selected', 'rejected', 'failed')),
  deterministic_score numeric(5,2),
  visual_score numeric(5,2),
  final_score numeric(5,2),
  hard_blockers text[] not null default '{}',
  warnings text[] not null default '{}',
  render_report jsonb not null default '{}'::jsonb,
  fingerprint text,
  screenshot_hash text,
  fallback_used boolean not null default false,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_key)
);

create index if not exists idx_pipeline_candidates_job
  on public.pipeline_candidates(job_id, status);

alter table public.pipeline_job_events enable row level security;
alter table public.pipeline_candidates enable row level security;

revoke all on table public.pipeline_job_events, public.pipeline_candidates
from public, anon, authenticated;
revoke all on sequence public.pipeline_job_events_id_seq
from public, anon, authenticated;

grant all on table public.pipeline_job_events, public.pipeline_candidates
to service_role;
grant usage, select on sequence public.pipeline_job_events_id_seq
to service_role;

create or replace function public.claim_pipeline_job(
  p_worker_id text,
  p_lease_seconds integer default 60,
  p_job_id uuid default null
)
returns setof public.pipeline_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id uuid;
begin
  select id
  into claimed_id
  from public.pipeline_jobs
  where pipeline_version = 'v2'
    and status in ('queued', 'running')
    and (p_job_id is null or id = p_job_id)
    and (
      status = 'queued'
      or lease_expires_at is null
      or lease_expires_at < now()
      or lease_owner = p_worker_id
    )
  order by
    case when p_job_id is not null and id = p_job_id then 0 else 1 end,
    queued_at asc
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  return query
  update public.pipeline_jobs
  set
    status = 'running',
    stage = case when stage = 'queued' then 'normalizing' else stage end,
    lease_owner = p_worker_id,
    lease_expires_at = now() + make_interval(secs => greatest(15, p_lease_seconds)),
    heartbeat_at = now(),
    started_at = coalesce(started_at, now()),
    attempt = attempt + 1,
    updated_at = now()
  where id = claimed_id
  returning *;
end;
$$;

create or replace function public.heartbeat_pipeline_job(
  p_job_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  touched integer;
begin
  update public.pipeline_jobs
  set
    heartbeat_at = now(),
    lease_expires_at = now() + make_interval(secs => greatest(15, p_lease_seconds)),
    updated_at = now()
  where id = p_job_id
    and status = 'running'
    and lease_owner = p_worker_id;

  get diagnostics touched = row_count;
  return touched = 1;
end;
$$;

revoke execute on function public.claim_pipeline_job(text, integer, uuid)
from public, anon, authenticated;
revoke execute on function public.heartbeat_pipeline_job(uuid, text, integer)
from public, anon, authenticated;

grant execute on function public.claim_pipeline_job(text, integer, uuid)
to service_role;
grant execute on function public.heartbeat_pipeline_job(uuid, text, integer)
to service_role;
