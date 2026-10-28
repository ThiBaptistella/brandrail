-- Hardening after Supabase advisors: private helper schema, per-command policies, FK indexes.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_member(target_org uuid, roles text[] default null)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = target_org
      and m.user_id = (select auth.uid())
      and (roles is null or m.role = any (roles))
  );
$$;
revoke all on function private.is_member(uuid, text[]) from public, anon;
grant execute on function private.is_member(uuid, text[]) to authenticated;

-- Organisations & memberships
drop policy if exists "members read org" on public.organizations;
drop policy if exists "admins update org" on public.organizations;
create policy "members read org" on public.organizations
  for select to authenticated using ((select private.is_member(id)));
create policy "admins update org" on public.organizations
  for update to authenticated using ((select private.is_member(id, array['owner','admin'])));

drop policy if exists "members read memberships" on public.memberships;
drop policy if exists "admins manage memberships" on public.memberships;
create policy "members read memberships" on public.memberships
  for select to authenticated using ((select private.is_member(org_id)));
create policy "admins insert memberships" on public.memberships
  for insert to authenticated with check ((select private.is_member(org_id, array['owner','admin'])));
create policy "admins update memberships" on public.memberships
  for update to authenticated using ((select private.is_member(org_id, array['owner','admin'])));
create policy "admins delete memberships" on public.memberships
  for delete to authenticated using ((select private.is_member(org_id, array['owner','admin'])));

-- Tenant tables: one policy per command
do $$
declare t text;
begin
  foreach t in array array['token_set_versions', 'components', 'targets', 'rule_configs', 'scans', 'violations'] loop
    execute format('drop policy if exists "members read" on public.%I', t);
    execute format('drop policy if exists "admins write" on public.%I', t);
    execute format('create policy "members read" on public.%I for select to authenticated using ((select private.is_member(org_id)))', t);
    execute format('create policy "admins insert" on public.%I for insert to authenticated with check ((select private.is_member(org_id, array[''owner'',''admin''])))', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using ((select private.is_member(org_id, array[''owner'',''admin''])))', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using ((select private.is_member(org_id, array[''owner'',''admin''])))', t);
  end loop;
end $$;

drop policy if exists "own keys" on public.api_keys;
create policy "own keys" on public.api_keys
  for all to authenticated
  using (user_id = (select auth.uid()) and (select private.is_member(org_id)))
  with check (user_id = (select auth.uid()) and (select private.is_member(org_id)));

drop function if exists public.is_member(uuid, text[]);

-- create_organization: signed-in users only
create or replace function public.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  insert into public.organizations (name, slug, created_by)
  values (org_name, lower(org_slug), (select auth.uid()))
  returning id into new_id;
  insert into public.memberships (org_id, user_id, role) values (new_id, (select auth.uid()), 'owner');
  return new_id;
end;
$$;
revoke all on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;

-- Foreign-key indexes
create index if not exists api_keys_org_idx on public.api_keys (org_id);
create index if not exists api_keys_user_idx on public.api_keys (user_id);
create index if not exists organizations_created_by_idx on public.organizations (created_by);
create index if not exists scans_org_idx on public.scans (org_id);
create index if not exists token_set_versions_created_by_idx on public.token_set_versions (created_by);
create index if not exists violations_org_idx on public.violations (org_id);
