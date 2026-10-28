-- Organisation management: members with emails, roles, invitations by email, delete.

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       text not null check (email = lower(email) and position('@' in email) > 1),
  role        text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  invited_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  unique (org_id, email)
);
create index invitations_email_idx on public.invitations (email);
alter table public.invitations enable row level security;
create policy "admins read invitations" on public.invitations
  for select to authenticated using ((select private.is_member(org_id, array['owner','admin'])));
create policy "admins delete invitations" on public.invitations
  for delete to authenticated using ((select private.is_member(org_id, array['owner','admin'])));
-- inserts go through invite_member()

-- Viewers can read but not run things; add the role to memberships.
alter table public.memberships drop constraint if exists memberships_role_check;
alter table public.memberships add constraint memberships_role_check check (role in ('owner', 'admin', 'member', 'viewer'));

create or replace function private.auth_email()
returns text language sql stable security definer set search_path = ''
as $$ select lower(email) from auth.users where id = (select auth.uid()) $$;
revoke all on function private.auth_email() from public, anon, authenticated;

-- Members of an organisation, with emails (auth.users isn't readable directly).
create or replace function public.org_members(p_org uuid)
returns table (user_id uuid, email text, name text, role text, joined_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_member(p_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text,
           coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'user_name', split_part(u.email, '@', 1))::text,
           m.role, m.created_at
    from public.memberships m join auth.users u on u.id = m.user_id
    where m.org_id = p_org
    order by case m.role when 'owner' then 0 when 'admin' then 1 when 'member' then 2 else 3 end, m.created_at;
end;
$$;
revoke all on function public.org_members(uuid) from public, anon;
grant execute on function public.org_members(uuid) to authenticated;

create or replace function public.invite_member(p_org uuid, p_email text, p_role text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_id uuid;
begin
  if not private.is_member(p_org, array['owner','admin']) then
    raise exception 'Only owners and admins can invite people.' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'member', 'viewer') then
    raise exception 'Role must be admin, member or viewer.' using errcode = '22023';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'That email address doesn''t look right.' using errcode = '22023';
  end if;
  if exists (select 1 from public.memberships m join auth.users u on u.id = m.user_id where m.org_id = p_org and lower(u.email) = v_email) then
    raise exception '% is already a member.', v_email using errcode = '23505';
  end if;
  if (select count(*) from public.invitations where org_id = p_org) >= 50 then
    raise exception 'Too many pending invitations.' using errcode = '53400';
  end if;
  insert into public.invitations (org_id, email, role, invited_by)
  values (p_org, v_email, p_role, (select auth.uid()))
  on conflict (org_id, email) do update set role = excluded.role, invited_by = excluded.invited_by, expires_at = now() + interval '14 days', created_at = now()
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.invite_member(uuid, text, text) from public, anon;
grant execute on function public.invite_member(uuid, text, text) to authenticated;

-- Pending invitations for the signed-in user's (verified) email.
create or replace function public.my_invitations()
returns table (id uuid, org_id uuid, org_name text, org_slug text, role text, invited_by_email text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select i.id, o.id, o.name, o.slug, i.role, u.email::text, i.created_at
  from public.invitations i
  join public.organizations o on o.id = i.org_id
  left join auth.users u on u.id = i.invited_by
  where i.email = private.auth_email()
    and i.expires_at > now()
    and exists (select 1 from auth.users me where me.id = (select auth.uid()) and me.email_confirmed_at is not null)
    and not exists (select 1 from public.memberships m where m.org_id = i.org_id and m.user_id = (select auth.uid()))
  order by i.created_at desc
$$;
revoke all on function public.my_invitations() from public, anon;
grant execute on function public.my_invitations() to authenticated;

create or replace function public.respond_invitation(p_id uuid, p_accept boolean)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare inv public.invitations;
begin
  select * into inv from public.invitations where id = p_id;
  if not found or inv.email <> private.auth_email() then
    raise exception 'Invitation not found.' using errcode = 'P0002';
  end if;
  if not exists (select 1 from auth.users me where me.id = (select auth.uid()) and me.email_confirmed_at is not null) then
    raise exception 'Confirm your email address first.' using errcode = '42501';
  end if;
  if inv.expires_at < now() then
    delete from public.invitations where id = p_id;
    raise exception 'This invitation has expired. Ask for a new one.' using errcode = '22023';
  end if;
  if p_accept then
    insert into public.memberships (org_id, user_id, role) values (inv.org_id, (select auth.uid()), inv.role)
    on conflict (org_id, user_id) do nothing;
  end if;
  delete from public.invitations where id = p_id;
  return inv.org_id;
end;
$$;
revoke all on function public.respond_invitation(uuid, boolean) from public, anon;
grant execute on function public.respond_invitation(uuid, boolean) to authenticated;

-- Role changes and removal. Owners are protected: only owners touch owners, and the last owner stays.
create or replace function public.set_member_role(p_org uuid, p_user uuid, p_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_current text;
  v_me_owner boolean := private.is_member(p_org, array['owner']);
begin
  if not private.is_member(p_org, array['owner','admin']) then
    raise exception 'Only owners and admins can change roles.' using errcode = '42501';
  end if;
  if p_role not in ('owner', 'admin', 'member', 'viewer') then
    raise exception 'Unknown role.' using errcode = '22023';
  end if;
  select role into v_current from public.memberships where org_id = p_org and user_id = p_user;
  if not found then raise exception 'Not a member.' using errcode = 'P0002'; end if;
  if (v_current = 'owner' or p_role = 'owner') and not v_me_owner then
    raise exception 'Only owners can add or change owners.' using errcode = '42501';
  end if;
  if v_current = 'owner' and p_role <> 'owner'
     and (select count(*) from public.memberships where org_id = p_org and role = 'owner') = 1 then
    raise exception 'An organisation needs at least one owner.' using errcode = '22023';
  end if;
  update public.memberships set role = p_role where org_id = p_org and user_id = p_user;
end;
$$;
revoke all on function public.set_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

create or replace function public.remove_member(p_org uuid, p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_role text;
begin
  select role into v_role from public.memberships where org_id = p_org and user_id = p_user;
  if not found then raise exception 'Not a member.' using errcode = 'P0002'; end if;
  -- You can always leave; removing others needs admin, and owners need an owner.
  if p_user <> (select auth.uid()) then
    if not private.is_member(p_org, array['owner','admin']) then
      raise exception 'Only owners and admins can remove people.' using errcode = '42501';
    end if;
    if v_role = 'owner' and not private.is_member(p_org, array['owner']) then
      raise exception 'Only owners can remove an owner.' using errcode = '42501';
    end if;
  end if;
  if v_role = 'owner' and (select count(*) from public.memberships where org_id = p_org and role = 'owner') = 1 then
    raise exception 'The last owner can''t leave. Make someone else an owner, or delete the organisation.' using errcode = '22023';
  end if;
  delete from public.memberships where org_id = p_org and user_id = p_user;
  -- Their API keys for this org stop working.
  update public.api_keys set revoked_at = now() where org_id = p_org and user_id = p_user and revoked_at is null;
end;
$$;
revoke all on function public.remove_member(uuid, uuid) from public, anon;
grant execute on function public.remove_member(uuid, uuid) to authenticated;

create or replace function public.delete_organization(p_org uuid, p_confirm_slug text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_member(p_org, array['owner']) then
    raise exception 'Only owners can delete the organisation.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.organizations where id = p_org and slug = lower(trim(p_confirm_slug))) then
    raise exception 'Type the organisation URL to confirm.' using errcode = '22023';
  end if;
  delete from public.organizations where id = p_org;
end;
$$;
revoke all on function public.delete_organization(uuid, text) from public, anon;
grant execute on function public.delete_organization(uuid, text) to authenticated;
