-- Project-scoped custom-domain purchase and Cloudflare verification state.

alter table public.projects
  add column if not exists custom_domain_status text not null default 'not_configured',
  add column if not exists custom_domain_checkout_session_id text,
  add column if not exists custom_domain_purchased_at timestamptz,
  add column if not exists custom_domain_error text,
  add column if not exists custom_domain_validation jsonb not null default '{}'::jsonb;

update public.projects
set custom_domain_status = 'active'
where custom_domain is not null
  and custom_domain_status = 'not_configured';

alter table public.projects
  drop constraint if exists projects_custom_domain_status_check;

alter table public.projects
  add constraint projects_custom_domain_status_check
  check (
    custom_domain_status in (
      'not_configured',
      'checkout_pending',
      'provisioning',
      'pending_dns',
      'active',
      'error'
    )
  );

create unique index if not exists idx_projects_custom_domain_checkout_session
  on public.projects(custom_domain_checkout_session_id)
  where custom_domain_checkout_session_id is not null;

create index if not exists idx_projects_custom_domain_status
  on public.projects(custom_domain_status)
  where custom_domain_status not in ('not_configured', 'active');
