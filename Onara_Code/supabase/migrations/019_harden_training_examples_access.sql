-- Phase 28 security review hardening.
-- Training examples can contain redacted generation artifacts, so direct table access
-- stays service-role only. User consent/delete flows run through server actions/RPC.

revoke all on table public.training_examples from public, anon, authenticated;
grant all on table public.training_examples to service_role;
