-- Pipeline V3: resumable component artifacts and V2/V3 durable job claiming.

create table if not exists public.pipeline_candidate_components (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.pipeline_jobs(id) on delete cascade,
  candidate_key text not null check (candidate_key in ('a', 'b')),
  component_id text not null,
  status text not null default 'generating'
    check (status in ('generating', 'eligible', 'fallback', 'failed')),
  model text not null default 'unknown',
  provider text not null default 'unknown',
  artifact_html text,
  artifact_css text,
  fingerprint text,
  attempts integer not null default 0 check (attempts >= 0),
  fallback_used boolean not null default false,
  warnings text[] not null default '{}',
  audit jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_key, component_id)
);

create index if not exists idx_pipeline_candidate_components_job
  on public.pipeline_candidate_components(job_id, candidate_key, status);

alter table public.pipeline_candidate_components enable row level security;

revoke all on table public.pipeline_candidate_components
from public, anon, authenticated;

grant all on table public.pipeline_candidate_components
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
  where pipeline_version in ('v2', 'v3')
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

