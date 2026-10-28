-- URL scans from the dashboard: the hosted scanner records results as the signed-in member,
-- through the same insert path the API-key ingest uses.

create or replace function private.record_scan(p_org uuid, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
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
  if v_report is null or v_score is null or v_score not between 0 and 100 then
    raise exception 'report.score (0-100) is required' using errcode = '22023';
  end if;
  if v_location = '' or v_kind not in ('repo', 'url') then
    raise exception 'target.kind (repo|url) and target.location are required' using errcode = '22023';
  end if;
  if v_source not in ('ci', 'cli', 'mcp', 'worker') then v_source := 'cli'; end if;

  insert into public.targets (org_id, kind, name, location)
  values (p_org, v_kind, left(coalesce(p_payload #>> '{target,name}', v_location), 120), v_location)
  on conflict (org_id, kind, location) do update set name = excluded.name
  returning id, threshold into v_target, v_target_threshold;

  insert into public.scans (
    org_id, target_id, source, ref, title, score, threshold, status, token_version,
    error_count, warning_count, info_count, files_scanned, lines_scanned, duration_ms, engine_version, by_rule, finished_at
  ) values (
    p_org, v_target, v_source,
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
  select v_scan, p_org,
         left(v ->> 'ruleId', 60),
         case when v ->> 'severity' in ('error', 'warning', 'info') then v ->> 'severity' else 'warning' end,
         left(v ->> 'file', 400),
         nullif((v ->> 'line')::int, 0),
         nullif((v ->> 'column')::int, 0),
         left(v ->> 'snippet', 300),
         left(coalesce(v ->> 'message', ''), 500),
         left(v ->> 'suggestion', 500)
  from jsonb_array_elements(coalesce(v_report -> 'violations', '[]'::jsonb)) with ordinality as t(v, i)
  where i <= 1000;

  return jsonb_build_object('scan_id', v_scan, 'target_id', v_target);
end;
$$;
revoke all on function private.record_scan(uuid, jsonb) from public, anon, authenticated;

-- POST /api/v1/scans (API key) now shares the insert path.
create or replace function public.ingest_scan(p_key text, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid;
begin
  select org_id into v_org from private.api_key_org(p_key, 'checks:write');
  return private.record_scan(v_org, p_payload);
end;
$$;
revoke all on function public.ingest_scan(text, jsonb) from public;
grant execute on function public.ingest_scan(text, jsonb) to anon, authenticated;

-- Dashboard URL scans: any member except viewers.
create or replace function public.record_member_scan(p_org uuid, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not private.is_member(p_org, array['owner', 'admin', 'member']) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  -- Light abuse guard: 30 dashboard URL scans per organisation per hour.
  if (select count(*) from public.scans s where s.org_id = p_org and s.source = 'worker' and s.created_at > now() - interval '1 hour') >= 30 then
    raise exception 'URL scan limit reached (30 per hour). Try again later.' using errcode = '53400';
  end if;
  return private.record_scan(p_org, p_payload || jsonb_build_object('source', 'worker'));
end;
$$;
revoke all on function public.record_member_scan(uuid, jsonb) from public, anon;
grant execute on function public.record_member_scan(uuid, jsonb) to authenticated;
