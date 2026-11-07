create or replace function app.strip_cost_keys(p jsonb)
returns jsonb
language sql
immutable
set search_path = pg_catalog
as $$
  select case jsonb_typeof(p)
    when 'object' then coalesce((
      select jsonb_object_agg(k, app.strip_cost_keys(v))
      from jsonb_each(p) e(k, v)
      where k !~* '(^|_)(unit_cost|cost|costs|amount|amount_given|total|price|shortage_value)(_|$)'
    ), '{}'::jsonb)
    when 'array' then coalesce((select jsonb_agg(app.strip_cost_keys(v)) from jsonb_array_elements(p) a(v)), '[]'::jsonb)
    else p
  end
$$;
revoke execute on function app.strip_cost_keys(jsonb) from public, anon;
grant execute on function app.strip_cost_keys(jsonb) to authenticated;

revoke select on public.audit_log from authenticated;
grant select (id, company_id, module, entity_type, entity_id, action, actor_id, store_id, channel, created_at) on public.audit_log to authenticated;

create view public.audit_history as
select a.id, a.company_id, a.module, a.entity_type, a.entity_id, a.action, a.actor_id, a.store_id, a.channel,
  case when app.is_company_admin(a.company_id) or app.has_special('see_costs') then a.before else app.strip_cost_keys(a.before) end as before,
  case when app.is_company_admin(a.company_id) or app.has_special('see_costs') then a.after else app.strip_cost_keys(a.after) end as after,
  a.created_at
from public.audit_log a
where app.is_company_admin(a.company_id)
  or ((select app.kind()) = 'admin' and (select app.is_aal2()) and a.company_id is null and a.actor_id = (select auth.uid()))
  or app.can(a.company_id, a.module, 'view');

revoke all on public.audit_history from public, anon, authenticated;
grant select on public.audit_history to authenticated;
