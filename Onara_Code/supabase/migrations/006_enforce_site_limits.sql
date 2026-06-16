-- Enforce plan-based active site limits at the database boundary.
-- Active slots are queued/generating/deploying/live. Failed generations do not count.

create or replace function public.enforce_project_site_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_project_count integer;
  effective_plan text;
  site_limit integer;
begin
  if tg_op = 'UPDATE'
    and old.user_id = new.user_id
    and old.status in (
      'queued'::public.site_status,
      'generating'::public.site_status,
      'deploying'::public.site_status,
      'live'::public.site_status
    )
    and new.status in (
      'queued'::public.site_status,
      'generating'::public.site_status,
      'deploying'::public.site_status,
      'live'::public.site_status
    ) then
    return new;
  end if;

  if new.status not in (
    'queued'::public.site_status,
    'generating'::public.site_status,
    'deploying'::public.site_status,
    'live'::public.site_status
  ) then
    return new;
  end if;

  select
    case
      when coalesce(u.is_trial, false) then 'pro'
      else coalesce(u.plan, 'free')
    end
  into effective_plan
  from public.users u
  where u.id = new.user_id;

  site_limit := case
    when effective_plan = 'pro' then 3
    else 1
  end;

  select count(*)
  into active_project_count
  from public.projects p
  where p.user_id = new.user_id
    and p.id <> new.id
    and p.status in (
      'queued'::public.site_status,
      'generating'::public.site_status,
      'deploying'::public.site_status,
      'live'::public.site_status
    );

  if active_project_count >= site_limit then
    raise exception 'site_limit_reached'
      using
        errcode = 'P0001',
        detail = format(
          'User %s has %s active projects and a limit of %s.',
          new.user_id,
          active_project_count,
          site_limit
        ),
        hint = 'Failed generations do not count against site limits.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_project_site_limit on public.projects;

create trigger trg_enforce_project_site_limit
before insert or update of user_id, status on public.projects
for each row
execute function public.enforce_project_site_limit();
