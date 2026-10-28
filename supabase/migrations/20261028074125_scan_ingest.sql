-- Scan ingest + Brand Kit lookup for the CLI, GitHub Action and (soon) MCP server.
-- Callers authenticate with an API key (only its sha256 is stored), not a user session.

alter table public.scans
  add column if not exists title          text,
  add column if not exists threshold      int check (threshold between 0 and 100),
  add column if not exists error_count    int not null default 0,
  add column if not exists warning_count  int not null default 0,
  add column if not exists info_count     int not null default 0,
  add column if not exists files_scanned  int,
  add column if not exists lines_scanned  int,
  add column if not exists duration_ms    int,
  add column if not exists engine_version text,
  add column if not exists by_rule        jsonb not null default '[]'::jsonb;

alter table public.violations add column if not exists col int;

create index if not exists scans_org_created_idx on public.scans (org_id, created_at desc);

-- Resolve an API key to its org, checking scope. Private: not exposed through the API.
create or replace function private.api_key_org(p_key text, p_scope text)
returns table (org_id uuid, key_id uuid)
language plpgsql security definer set search_path = ''
as $$
declare
  k record;
begin
  if p_key is null or length(p_key) < 20 then
    raise exception 'invalid api key' using errcode = '28000';
  end if;
  select ak.id, ak.org_id, ak.scopes into k
  from public.api_keys ak
  where ak.key_hash = encode(extensions.digest(convert_to(p_key, 'UTF8'), 'sha256'), 'hex')
    and ak.revoked_at is null;
  if not found then
    raise exception 'invalid api key' using errcode = '28000';
  end if;
  if not (p_scope = any (k.scopes)) then
    raise exception 'api key is missing the % scope', p_scope using errcode = '42501';
  end if;
  update public.api_keys set last_used_at = now() where id = k.id;
  return query select k.org_id, k.id;
end;
$$;
revoke all on function private.api_key_org(text, text) from public, anon, authenticated;

-- POST /api/v1/scans
create or replace function public.ingest_scan(p_key text, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_target uuid;
  v_target_threshold int;
  v_scan uuid;
  v_report jsonb := p_payload -> 'report';
  v_score int := (p_payload #>> '{report,score}')::int;
  v_threshold int := nullif(p_payload ->> 'threshold', '')::int;
  v_kind text := coalesce(p_payload #>> '{target,kind}', 'repo');
  v_location text := left(coalesce(p_payload #>> '{target,location}', ''), 300);
  v_source text := coalesce(p_payload ->> 'source', 'cli');
begin
  select org_id into v_org from private.api_key_org(p_key, 'checks:write');

  if v_report is null or v_score is null or v_score not between 0 and 100 then
    raise exception 'report.score (0-100) is required' using errcode = '22023';
  end if;
  if v_location = '' or v_kind not in ('repo', 'url') then
    raise exception 'target.kind (repo|url) and target.location are required' using errcode = '22023';
  end if;
  if v_source not in ('ci', 'cli', 'mcp', 'worker') then v_source := 'cli'; end if;

  insert into public.targets (org_id, kind, name, location)
  values (v_org, v_kind, left(coalesce(p_payload #>> '{target,name}', v_location), 120), v_location)
  on conflict (org_id, kind, location) do update set name = excluded.name
  returning id, threshold into v_target, v_target_threshold;

  insert into public.scans (
    org_id, target_id, source, ref, title, score, threshold, status, token_version,
    error_count, warning_count, info_count, files_scanned, lines_scanned, duration_ms, engine_version, by_rule, finished_at
  ) values (
    v_org, v_target, v_source,
    left(p_payload ->> 'ref', 200),
    left(p_payload ->> 'title', 200),
    v_score,
    v_threshold,
    case when v_score >= coalesce(v_threshold, v_target_threshold) then 'passed' else 'failed' end,
    left(v_report ->> 'tokenVersion', 40),
    coalesce((v_report #>> '{counts,error}')::int, 0),
    coalesce((v_report #>> '{counts,warning}')::int, 0),
    coalesce((v_report #>> '{counts,info}')::int, 0),
    (v_report ->> 'filesScanned')::int,
    (v_report ->> 'linesScanned')::int,
    (v_report ->> 'durationMs')::int,
    left(v_report ->> 'engineVersion', 20),
    coalesce(v_report -> 'byRule', '[]'::jsonb),
    now()
  ) returning id into v_scan;

  insert into public.violations (scan_id, org_id, rule_id, severity, file, line, col, snippet, message, suggestion)
  select v_scan, v_org,
         left(v ->> 'ruleId', 60),
         case when v ->> 'severity' in ('error', 'warning', 'info') then v ->> 'severity' else 'warning' end,
         left(v ->> 'file', 400),
         (v ->> 'line')::int,
         (v ->> 'column')::int,
         left(v ->> 'snippet', 300),
         left(coalesce(v ->> 'message', ''), 500),
         left(v ->> 'suggestion', 500)
  from jsonb_array_elements(coalesce(v_report -> 'violations', '[]'::jsonb)) with ordinality as t(v, i)
  where i <= 1000;

  return jsonb_build_object('scan_id', v_scan, 'target_id', v_target);
end;
$$;
revoke all on function public.ingest_scan(text, jsonb) from public;
grant execute on function public.ingest_scan(text, jsonb) to anon, authenticated;

-- GET /api/v1/brand-kit
create or replace function public.get_brand_kit(p_key text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_result jsonb;
begin
  select org_id into v_org from private.api_key_org(p_key, 'mcp:read');
  select jsonb_build_object(
    'org', o.name,
    'slug', o.slug,
    'tokenVersion', tv.version,
    'tokens', coalesce(tv.tokens, '{}'::jsonb),
    'components', coalesce((
      select jsonb_agg(jsonb_build_object('name', c.name, 'importPath', c.import_path) order by c.name)
      from public.components c where c.org_id = o.id and c.status <> 'deprecated'
    ), '[]'::jsonb)
  ) into v_result
  from public.organizations o
  left join lateral (
    select t.version, t.tokens from public.token_set_versions t
    where t.org_id = o.id and t.status = 'published'
    order by t.created_at desc limit 1
  ) tv on true
  where o.id = v_org;
  return v_result;
end;
$$;
revoke all on function public.get_brand_kit(text) from public;
grant execute on function public.get_brand_kit(text) to anon, authenticated;
