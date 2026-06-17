-- Revision jobs run in the FastAPI revision queue, not in public.pipeline_jobs.
-- Keep the UUID job id for status polling, but do not enforce a build-job FK.

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
      and c.conrelid = 'public.revisions'::regclass
      and c.confrelid = 'public.pipeline_jobs'::regclass
      and a.attname = 'pipeline_job_id'
  loop
    execute format('alter table public.revisions drop constraint if exists %I', constraint_name);
  end loop;
end $$;
