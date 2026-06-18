-- Phase 26: lead capture log for generated-site contact forms.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  message text,
  source_url text,
  user_agent text,
  email_status text not null default 'pending'
    check (email_status in ('pending', 'sent', 'failed', 'disabled')),
  email_error text,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

revoke all on table public.leads from public, anon, authenticated;
grant all on table public.leads to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'leads'
      and policyname = 'leads_select_own'
  ) then
    create policy "leads_select_own" on public.leads
      for select using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_leads_project_id on public.leads(project_id);
create index if not exists idx_leads_user_id_created_at on public.leads(user_id, created_at desc);
create index if not exists idx_leads_email_status on public.leads(email_status);
