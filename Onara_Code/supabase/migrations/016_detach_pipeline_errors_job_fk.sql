-- FastAPI build jobs are tracked by runtime UUIDs on public.projects.pipeline_job_id.
-- public.pipeline_jobs is legacy metadata, so pipeline_errors must not require that FK.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
      and a.attnum = any(c.conkey)
    where c.contype = 'f'
      and c.conrelid = 'public.pipeline_errors'::regclass
      and c.confrelid = 'public.pipeline_jobs'::regclass
      and a.attname = 'job_id'
  loop
    execute format('alter table public.pipeline_errors drop constraint if exists %I', constraint_name);
  end loop;
end $$;
