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
  permissions jsonb
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

create function public.assign_user_stores(p_user uuid, p_assignments jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_company uuid;
  v_new record;
  v_old record;
begin
  if app.kind() is distinct from 'admin' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select company_id into v_company from public.profiles
  where id = p_user and kind = 'operator' and deleted_at is null and status <> 'deactivated'
  for update;
  if v_company is null or not app.is_company_admin(v_company) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  create temporary table pg_temp.new_assignments on commit drop as
    select (a ->> 'store_id')::uuid as store_id, (a ->> 'role_id')::uuid as role_id
    from jsonb_array_elements(p_assignments) a;
  if (select count(distinct store_id) from pg_temp.new_assignments) <> (select count(*) from pg_temp.new_assignments) then
    raise exception 'DUPLICATE_STORE' using errcode = '23505';
  end if;

  for v_old in select distinct role_id from public.user_stores where user_id = p_user loop
    if not app.owns_role(v_old.role_id) then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  end loop;
  for v_new in select distinct role_id from pg_temp.new_assignments loop
    if not app.owns_role(v_new.role_id) then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  end loop;

  update public.app_sessions set active_store_id = null
  where user_id = p_user and active_store_id in (
    select us.store_id from public.user_stores us
    where us.user_id = p_user and us.store_id not in (select store_id from pg_temp.new_assignments)
  );
  delete from public.user_stores
  where user_id = p_user and store_id not in (select store_id from pg_temp.new_assignments);
  update public.user_stores us set role_id = n.role_id
  from pg_temp.new_assignments n
  where us.user_id = p_user and us.store_id = n.store_id and us.role_id <> n.role_id;
  insert into public.user_stores (user_id, store_id, company_id, role_id)
  select p_user, n.store_id, v_company, n.role_id from pg_temp.new_assignments n
  where not exists (select 1 from public.user_stores us where us.user_id = p_user and us.store_id = n.store_id);
  drop table pg_temp.new_assignments;
end;
$$;

create function public.set_operator_status(p_user uuid, p_status public.profile_status)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_company uuid;
  v_current public.profile_status;
begin
  if app.kind() is distinct from 'admin' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select company_id, status into v_company, v_current from public.profiles
  where id = p_user and kind = 'operator' and deleted_at is null
  for update;
  if v_company is null or not app.is_company_admin(v_company) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status = 'deactivated' and v_current <> 'deactivated' then
    update public.profiles set status = 'deactivated' where id = p_user;
  elsif p_status = 'active' and v_current = 'locked' then
    perform public.unlock_profile(p_user);
  else
    raise exception 'INVALID_STATUS_TRANSITION' using errcode = '22023';
  end if;
end;
$$;

drop policy user_stores_delete on public.user_stores;
create policy user_stores_delete on public.user_stores for delete to authenticated using (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id) and app.owns_role(role_id)
);

revoke execute on function public.my_store_access(uuid), public.assign_user_stores(uuid, jsonb), public.set_operator_status(uuid, public.profile_status) from public, anon;
grant execute on function public.my_store_access(uuid), public.assign_user_stores(uuid, jsonb), public.set_operator_status(uuid, public.profile_status) to authenticated;
