-- Harden public API exposure after moving app table access behind server routes.
-- RLS policies remain in place, but direct PostgREST/GraphQL table access is no longer needed.

revoke all on table
  public.users,
  public.projects,
  public.pipeline_jobs,
  public.revisions,
  public.pipeline_errors,
  public.gbp_sync_log,
  public.stripe_events
from public, anon, authenticated;

grant all on table
  public.users,
  public.projects,
  public.pipeline_jobs,
  public.revisions,
  public.pipeline_errors,
  public.gbp_sync_log,
  public.stripe_events
to service_role;

-- SECURITY DEFINER functions are trigger/internal helpers, not public RPC endpoints.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_project_site_limit() from public, anon, authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
