-- Component props: get_brand_kit returns each component's props (from props_schema), so AI tools only use props that exist.

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
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'name', c.name,
        'importPath', c.import_path,
        'description', c.description,
        'status', c.status,
        'replaces', case when cardinality(c.replaces) > 0 then to_jsonb(c.replaces) end,
        'aliases', case when cardinality(c.aliases) > 0 then to_jsonb(c.aliases) end,
        'usageRules', case when cardinality(c.usage_rules) > 0 then to_jsonb(c.usage_rules) end,
        'example', c.example,
        'props', case when jsonb_typeof(c.props_schema->'props') = 'array' and jsonb_array_length(c.props_schema->'props') > 0 then c.props_schema->'props' end,
        'htmlAttributes', c.props_schema->>'htmlAttributes'
      )) order by c.name)
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
