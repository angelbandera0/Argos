alter table public.role_permissions drop constraint role_permissions_module_check;
alter table public.role_permissions add constraint role_permissions_module_check
  check (module in ('products', 'currencies', 'stock', 'requests', 'orders', 'notifications'));
alter table public.role_permissions add constraint role_permissions_notifications_view_only
  check (module <> 'notifications' or not (can_create or can_edit or can_delete));

create table public.role_special_permissions (
  role_id uuid not null references public.roles (id),
  permission text not null check (permission in (
    'see_costs', 'choose_lot', 'initial_entry', 'direct_store_entry', 'transfer', 'write_off', 'adjust_stock',
    'configure_units', 'configure_minimums', 'request_replenishment', 'handle_requests', 'build_orders',
    'make_purchases', 'review_orders', 'correct_orders'
  )),
  warehouse boolean not null default false,
  primary key (role_id, permission)
);

alter table public.role_special_permissions enable row level security;

create policy role_special_permissions_select on public.role_special_permissions for select to authenticated
using (app.owns_role(role_id));
create policy role_special_permissions_insert on public.role_special_permissions for insert to authenticated
with check (app.owns_role(role_id));
create policy role_special_permissions_update on public.role_special_permissions for update to authenticated
using (app.owns_role(role_id))
with check (app.owns_role(role_id));
create policy role_special_permissions_delete on public.role_special_permissions for delete to authenticated
using (app.owns_role(role_id));

create function app.has_special(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select app.kind() = 'admin' or (
    app.kind() = 'operator' and app.session_active() and exists (
      select 1
      from public.user_stores us
      join public.roles r on r.id = us.role_id and r.deleted_at is null
      join public.role_special_permissions sp on sp.role_id = us.role_id and sp.permission = p_permission
      where us.user_id = auth.uid()
        and app.is_operational(us.store_id)
        and not exists (
          select 1 from public.role_company_exclusions e
          where e.role_id = us.role_id and e.company_id = us.company_id
        )
    )
  )
$$;

create function app.has_special_in_store(p_permission text, p_store uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select case
      when app.kind() = 'admin' then app.is_company_admin(s.company_id)
      else app.kind() = 'operator' and app.session_active() and app.is_operational(s.id) and exists (
        select 1
        from public.user_stores us
        join public.roles r on r.id = us.role_id and r.deleted_at is null
        join public.role_special_permissions sp on sp.role_id = us.role_id and sp.permission = p_permission
        where us.user_id = auth.uid()
          and us.store_id = s.id
          and not exists (
            select 1 from public.role_company_exclusions e
            where e.role_id = us.role_id and e.company_id = us.company_id
          )
      )
    end
    from public.stores s
    where s.id = p_store
  ), false)
$$;

create function app.has_special_warehouse(p_permission text, p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select case
    when app.kind() = 'admin' then app.is_company_admin(p_company)
    else app.kind() = 'operator' and app.session_active() and exists (
      select 1
      from public.user_stores us
      join public.roles r on r.id = us.role_id and r.deleted_at is null
      join public.role_special_permissions sp
        on sp.role_id = us.role_id and sp.permission = p_permission and sp.warehouse
      where us.user_id = auth.uid()
        and us.company_id = p_company
        and app.is_operational(us.store_id)
        and not exists (
          select 1 from public.role_company_exclusions e
          where e.role_id = us.role_id and e.company_id = us.company_id
        )
    )
  end
$$;

revoke execute on function app.has_special(text), app.has_special_in_store(text, uuid), app.has_special_warehouse(text, uuid) from public, anon;
grant execute on function app.has_special(text), app.has_special_in_store(text, uuid), app.has_special_warehouse(text, uuid) to authenticated;

create or replace function app.audit_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  o jsonb;
  n jsonb := to_jsonb(new) - 'failed_pin_attempts' - 'must_change_password';
  act text;
  uid uuid := auth.uid();
  client text := auth.jwt() ->> 'client_id';
begin
  if tg_op = 'INSERT' then
    act := 'create';
  else
    o := to_jsonb(old) - 'failed_pin_attempts' - 'must_change_password';
    if (o - 'updated_at') = (n - 'updated_at') then
      return null;
    end if;
    if o ->> 'deleted_at' is null and n ->> 'deleted_at' is not null then
      act := 'delete';
    elsif o ->> 'status' is distinct from n ->> 'status' then
      act := case when n ->> 'status' in ('inactive', 'locked', 'deactivated') then 'deactivate' else 'reactivate' end;
    elsif o ->> 'active' is distinct from n ->> 'active' then
      act := case when n ->> 'active' = 'false' then 'deactivate' else 'reactivate' end;
    else
      act := 'update';
    end if;
  end if;

  insert into public.audit_log (company_id, module, entity_type, entity_id, action, actor_id, store_id, channel, before, after)
  values (
    case tg_table_name when 'companies' then (n ->> 'id')::uuid else (n ->> 'company_id')::uuid end,
    case tg_table_name
      when 'categories' then 'products'
      when 'products' then 'products'
      when 'currencies' then 'currencies'
      when 'currency_denominations' then 'currencies'
      when 'roles' then 'roles'
      when 'role_permissions' then 'roles'
      when 'role_special_permissions' then 'roles'
      when 'role_company_exclusions' then 'roles'
      when 'profiles' then 'users'
      when 'user_stores' then 'users'
      else 'organization'
    end,
    tg_table_name,
    (case tg_table_name
      when 'company_admins' then n ->> 'admin_id'
      when 'role_permissions' then n ->> 'role_id'
      when 'role_special_permissions' then n ->> 'role_id'
      when 'role_company_exclusions' then n ->> 'role_id'
      when 'user_stores' then n ->> 'user_id'
      else n ->> 'id'
    end)::uuid,
    act,
    uid,
    (select s.active_store_id from public.app_sessions s
      where s.session_id = (auth.jwt() ->> 'session_id')::uuid and s.user_id = uid),
    case when uid is null then 'system' when client is null then 'ui' else 'api' end,
    o,
    n
  );
  return null;
end;
$$;

create trigger audit_role_special_permissions after insert or update on public.role_special_permissions
  for each row execute function app.audit_row();

drop policy currencies_select on public.currencies;
drop policy currencies_insert on public.currencies;
drop policy currencies_update on public.currencies;
drop policy currency_denominations_select on public.currency_denominations;
drop policy currency_denominations_insert on public.currency_denominations;
drop policy currency_denominations_update on public.currency_denominations;

create policy currencies_select on public.currencies for select to authenticated using (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'currencies', 'view'))
);
create policy currencies_insert on public.currencies for insert to authenticated with check (
  ((select app.kind()) = 'admin' and app.is_company_admin(company_id))
  or (deleted_at is null and app.can(company_id, 'currencies', 'create'))
);
create policy currencies_update on public.currencies for update to authenticated
using (
  app.is_company_admin(company_id)
  or (deleted_at is null and (app.can(company_id, 'currencies', 'edit') or app.can(company_id, 'currencies', 'delete')))
)
with check (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'currencies', 'edit'))
  or (deleted_at is not null and app.can(company_id, 'currencies', 'delete'))
);

create policy currency_denominations_select on public.currency_denominations for select to authenticated using (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'currencies', 'view'))
);
create policy currency_denominations_insert on public.currency_denominations for insert to authenticated with check (
  ((select app.kind()) = 'admin' and app.is_company_admin(company_id))
  or (deleted_at is null and app.can(company_id, 'currencies', 'create'))
);
create policy currency_denominations_update on public.currency_denominations for update to authenticated
using (
  app.is_company_admin(company_id)
  or (deleted_at is null and (app.can(company_id, 'currencies', 'edit') or app.can(company_id, 'currencies', 'delete')))
)
with check (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'currencies', 'edit'))
  or (deleted_at is not null and app.can(company_id, 'currencies', 'delete'))
);
