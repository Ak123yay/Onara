-- Track the signup/auth provider on public.users so the app can guide OAuth-only
-- users toward the correct login method without exposing auth.users to clients.

alter table public.users
  add column if not exists auth_provider text,
  add column if not exists auth_providers text[] not null default '{}';

create or replace function public.auth_providers_from_metadata(metadata jsonb)
returns text[]
language plpgsql
immutable
as $$
declare
  providers text[];
  primary_provider text;
begin
  if metadata is null then
    return array['email'];
  end if;

  if jsonb_typeof(metadata->'providers') = 'array' then
    select coalesce(array_agg(provider_name), '{}'::text[])
    into providers
    from jsonb_array_elements_text(metadata->'providers') as provider_row(provider_name);

    if array_length(providers, 1) > 0 then
      return providers;
    end if;
  end if;

  primary_provider := nullif(metadata->>'provider', '');
  if primary_provider is not null then
    return array[primary_provider];
  end if;

  return array['email'];
end;
$$;

update public.users as public_user
set
  auth_provider = coalesce(auth_user.raw_app_meta_data->>'provider', (public.auth_providers_from_metadata(auth_user.raw_app_meta_data))[1], 'email'),
  auth_providers = public.auth_providers_from_metadata(auth_user.raw_app_meta_data)
from auth.users as auth_user
where public_user.id = auth_user.id
  and (
    public_user.auth_provider is null
    or public_user.auth_providers = '{}'::text[]
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    avatar_url,
    plan,
    auth_provider,
    auth_providers,
    is_trial,
    trial_ends_at,
    revisions_limit,
    revisions_used,
    show_url
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'pro',
    coalesce(new.raw_app_meta_data->>'provider', (public.auth_providers_from_metadata(new.raw_app_meta_data))[1], 'email'),
    public.auth_providers_from_metadata(new.raw_app_meta_data),
    true,
    now() + interval '14 days',
    -1,
    0,
    true
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.users.full_name, excluded.full_name),
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url),
    auth_provider = excluded.auth_provider,
    auth_providers = excluded.auth_providers;

  return new;
end;
$$;
