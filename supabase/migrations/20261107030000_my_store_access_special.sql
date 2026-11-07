drop function public.my_store_access(uuid);

create function public.my_store_access(p_store uuid default null)
returns table (
  store_id uuid,
  store_name text,
  site_name text,
  company_id uuid,
  role_id uuid,
  role_name text,
  role_session_seconds int,
  company_cap_seconds int,
  operational boolean,
  permissions jsonb,
  special jsonb
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select st.id, st.name, si.name, st.company_id, r.id, r.name, r.session_seconds, c.session_cap_seconds,
    app.is_operational(st.id),
    case
      when r.deleted_at is not null or exists (
        select 1 from public.role_company_exclusions e where e.role_id = r.id and e.company_id = st.company_id
      ) then '{}'::jsonb
      else coalesce((
        select jsonb_object_agg(rp.module, jsonb_build_object(
          'view', rp.can_view, 'create', rp.can_create, 'edit', rp.can_edit, 'delete', rp.can_delete))
        from public.role_permissions rp where rp.role_id = r.id
      ), '{}'::jsonb)
    end,
    case
      when r.deleted_at is not null or exists (
        select 1 from public.role_company_exclusions e where e.role_id = r.id and e.company_id = st.company_id
      ) then '[]'::jsonb
      else coalesce((
        select jsonb_agg(jsonb_build_object('permission', sp.permission, 'warehouse', sp.warehouse) order by sp.permission)
        from public.role_special_permissions sp where sp.role_id = r.id
      ), '[]'::jsonb)
    end
  from public.user_stores us
  join public.stores st on st.id = us.store_id
  join public.sites si on si.id = st.site_id
  join public.companies c on c.id = st.company_id
  join public.roles r on r.id = us.role_id
  where app.kind() = 'operator'
    and us.user_id = auth.uid()
    and (p_store is null or us.store_id = p_store)
  order by si.name, st.name
$$;

revoke execute on function public.my_store_access(uuid) from public, anon;
grant execute on function public.my_store_access(uuid) to authenticated;
