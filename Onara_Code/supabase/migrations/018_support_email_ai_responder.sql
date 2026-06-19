-- Phase 28: support email AI responder.
-- Logs inbound support messages, AI first replies, forwarding state, and human-review escalation flags.

create table if not exists public.support_threads (
  id uuid primary key default gen_random_uuid(),
  inbound_event_id text not null unique,
  resend_email_id text,
  resend_message_id text,
  from_email text,
  from_name text,
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  subject text,
  inbound_text text,
  inbound_html text,
  inbound_headers jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  classification text not null default 'general'
    check (classification in ('general', 'billing', 'account', 'security', 'technical', 'sales', 'legal', 'spam')),
  escalation_required boolean not null default false,
  escalation_reason text,
  ai_status text not null default 'pending'
    check (ai_status in ('pending', 'sent', 'failed', 'skipped', 'disabled')),
  ai_model text,
  ai_response text,
  ai_error text,
  forward_status text not null default 'pending'
    check (forward_status in ('pending', 'sent', 'failed', 'skipped')),
  forward_error text,
  forwarded_at timestamptz,
  first_reply_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_threads_created_at
  on public.support_threads(created_at desc);

create index if not exists idx_support_threads_escalation
  on public.support_threads(escalation_required, created_at desc)
  where escalation_required = true;

create index if not exists idx_support_threads_from_email
  on public.support_threads(from_email);

alter table public.support_threads enable row level security;

revoke all on table public.support_threads from public, anon, authenticated;
grant all on table public.support_threads to service_role;
