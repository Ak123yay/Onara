-- Phase 23: let users resume an active generation from the dashboard.

alter table public.projects
  add column if not exists pipeline_job_id uuid;

create index if not exists idx_projects_pipeline_job_id
  on public.projects(pipeline_job_id)
  where pipeline_job_id is not null;
