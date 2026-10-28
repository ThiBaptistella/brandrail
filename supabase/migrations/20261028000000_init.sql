-- Brandrail initial schema
-- Every tenant-owned row carries org_id and is protected by row-level security.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Organisations & membership
-- ---------------------------------------------------------------------------
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  slug        text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$'),
  plan        text not null default 'free' check (plan in ('free', 'team', 'business', 'enterprise')),
  region      text not null default 'ap-southeast-2',
  created_by  uuid not null references auth.users (id) on delete restrict,
  created_at  timestamptz not null default now()
);

create table public.memberships (
  org_id      uuid not null references public.organizations (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

-- Helper: is the current user a member (optionally with one of the given roles)?
create or replace function public.is_member(target_org uuid, roles text[] default null)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and (roles is null or m.role = any (roles))
  );
$$;

-- Create an organisation and make the caller its owner, atomically.
create or replace function public.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  insert into public.organizations (name, slug, created_by)
  values (org_name, lower(org_slug), auth.uid())
  returning id into new_id;
  insert into public.memberships (org_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;
revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Brand Kit: versioned token sets (W3C DTCG JSON) and component registry
-- ---------------------------------------------------------------------------
create table public.token_set_versions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  version       text not null,                       -- semver, e.g. 1.4.0
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  tokens        jsonb not null default '{}'::jsonb,  -- DTCG document
  source        text not null default 'manual' check (source in ('manual', 'figma', 'code', 'import')),
  notes         text,
  published_at  timestamptz,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  unique (org_id, version)
);
create index token_set_versions_org_idx on public.token_set_versions (org_id, created_at desc);

create table public.components (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  name          text not null,                       -- e.g. Button
  import_path   text not null,                       -- e.g. @acme/ui
  description   text,
  props_schema  jsonb not null default '{}'::jsonb,
  usage_rules   text[] not null default '{}',
  examples      jsonb not null default '[]'::jsonb,
  status        text not null default 'stable' check (status in ('draft', 'beta', 'stable', 'deprecated')),
  updated_at    timestamptz not null default now(),
  unique (org_id, name)
);

-- ---------------------------------------------------------------------------
-- Checker: targets, rule config, scans and violations
-- ---------------------------------------------------------------------------
create table public.targets (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  kind        text not null check (kind in ('repo', 'url')),
  name        text not null,
  location    text not null,                         -- owner/repo or https URL
  threshold   int  not null default 80 check (threshold between 0 and 100),
  created_at  timestamptz not null default now(),
  unique (org_id, kind, location)
);

create table public.rule_configs (
  org_id    uuid not null references public.organizations (id) on delete cascade,
  rule_id   text not null,
  severity  text not null default 'warning' check (severity in ('off', 'info', 'warning', 'error')),
  primary key (org_id, rule_id)
);

create table public.scans (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  target_id   uuid not null references public.targets (id) on delete cascade,
  source      text not null check (source in ('ci', 'cli', 'mcp', 'worker')),
  ref         text,                                  -- commit sha, PR number or URL
  score       int  check (score between 0 and 100),
  status      text not null default 'queued' check (status in ('queued', 'running', 'passed', 'failed', 'error')),
  token_version text,
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);
create index scans_target_idx on public.scans (target_id, created_at desc);

create table public.violations (
  id          bigint generated always as identity primary key,
  scan_id     uuid not null references public.scans (id) on delete cascade,
  org_id      uuid not null references public.organizations (id) on delete cascade,
  rule_id     text not null,
  severity    text not null check (severity in ('info', 'warning', 'error')),
  file        text,
  line        int,
  snippet     text,                                  -- optional in code-local mode
  message     text not null,
  suggestion  text
);
create index violations_scan_idx on public.violations (scan_id);

-- ---------------------------------------------------------------------------
-- API keys for CLI / MCP (only the hash is stored)
-- ---------------------------------------------------------------------------
create table public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  prefix        text not null,                       -- first 8 chars, shown in UI
  key_hash      text not null unique,                -- sha256 of the full key
  scopes        text[] not null default '{mcp:read,checks:write}',
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.organizations      enable row level security;
alter table public.memberships        enable row level security;
alter table public.token_set_versions enable row level security;
alter table public.components         enable row level security;
alter table public.targets            enable row level security;
alter table public.rule_configs       enable row level security;
alter table public.scans              enable row level security;
alter table public.violations         enable row level security;
alter table public.api_keys           enable row level security;

create policy "members read org" on public.organizations
  for select using (public.is_member(id));
create policy "admins update org" on public.organizations
  for update using (public.is_member(id, array['owner', 'admin']));

create policy "members read memberships" on public.memberships
  for select using (public.is_member(org_id));
create policy "admins manage memberships" on public.memberships
  for all using (public.is_member(org_id, array['owner', 'admin']))
  with check (public.is_member(org_id, array['owner', 'admin']));

-- Tenant tables: members read, owners/admins write.
do $$
declare t text;
begin
  foreach t in array array['token_set_versions', 'components', 'targets', 'rule_configs', 'scans', 'violations'] loop
    execute format('create policy "members read" on public.%I for select using (public.is_member(org_id))', t);
    execute format(
      'create policy "admins write" on public.%I for all using (public.is_member(org_id, array[''owner'',''admin''])) with check (public.is_member(org_id, array[''owner'',''admin'']))',
      t);
  end loop;
end $$;

-- API keys: users see and manage only their own keys.
create policy "own keys" on public.api_keys
  for all using (user_id = auth.uid() and public.is_member(org_id))
  with check (user_id = auth.uid() and public.is_member(org_id));
