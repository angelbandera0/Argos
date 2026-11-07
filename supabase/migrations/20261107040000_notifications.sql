create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  store_id uuid references public.stores (id),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  module text not null check (module in ('products', 'currencies', 'stock', 'requests', 'orders', 'roles', 'users', 'organization', 'system')),
  operation text not null check (operation ~ '^[a-z_]{1,40}$'),
  priority text not null check (priority in ('info', 'warning', 'urgent')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) <= 1000),
  link text check (link ~ '^/[^/]' or link = '/'),
  actor_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;
create index notifications_recipient_module_op_idx on public.notifications (recipient_id, module, operation);

alter table public.notifications enable row level security;

create policy notifications_select on public.notifications for select to authenticated
using (recipient_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- N-09: quien emite es responsable de no incluir costos en título/cuerpo para quien no tenga see_costs.
create function app.notify(
  p_company uuid, p_module text, p_operation text, p_priority text, p_title text, p_body text, p_link text,
  p_store uuid default null, p_special text default null, p_module_perm text default null,
  p_warehouse boolean default false, p_include_admins boolean default true
)
returns int
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_mod text := split_part(p_module_perm, '.', 1);
  v_op text := split_part(p_module_perm, '.', 2);
  v_actor uuid := auth.uid();
  v_count int;
begin
  if p_module not in ('products', 'currencies', 'stock', 'requests', 'orders', 'roles', 'users', 'organization', 'system') then
    raise exception 'invalid module' using errcode = '22023';
  end if;
  if p_priority not in ('info', 'warning', 'urgent') then
    raise exception 'invalid priority' using errcode = '22023';
  end if;
  if p_title is null or char_length(p_title) not between 1 and 200 or char_length(coalesce(p_body, '')) > 1000 then
    raise exception 'invalid title or body' using errcode = '22023';
  end if;
  if p_module_perm is not null and v_op not in ('view', 'create', 'edit', 'delete') then
    raise exception 'invalid module permission' using errcode = '22023';
  end if;

  insert into public.notifications (company_id, store_id, recipient_id, module, operation, priority, title, body, link, actor_id)
  select p_company, p_store, r.id, p_module, p_operation, p_priority, p_title, coalesce(p_body, ''), p_link, v_actor
  from (
    select ca.admin_id as id
    from public.company_admins ca
    join public.profiles p on p.id = ca.admin_id and p.status = 'active' and p.deleted_at is null
    where p_include_admins and ca.company_id = p_company
    union
    select us.user_id
    from public.user_stores us
    join public.profiles p on p.id = us.user_id and p.kind = 'operator' and p.status = 'active' and p.deleted_at is null
    join public.roles ro on ro.id = us.role_id and ro.deleted_at is null
    where us.company_id = p_company
      and app.is_operational(us.store_id)
      and not exists (
        select 1 from public.role_company_exclusions e where e.role_id = us.role_id and e.company_id = us.company_id
      )
      and (
        (p_special is not null and exists (
          select 1 from public.role_special_permissions sp
          where sp.role_id = us.role_id and sp.permission = p_special
            and ((p_store is not null and us.store_id = p_store) or ((p_store is null or p_warehouse) and sp.warehouse))
        ))
        or (p_module_perm is not null and exists (
          select 1 from public.role_permissions rp
          where rp.role_id = us.role_id and rp.module = v_mod
            and (p_store is null or us.store_id = p_store)
            and case v_op when 'view' then rp.can_view when 'create' then rp.can_create
                  when 'edit' then rp.can_edit else rp.can_delete end
        ))
      )
  ) r
  where r.id is distinct from v_actor;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.mark_notifications_read(p_ids uuid[] default null)
returns int
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_count int;
begin
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.unread_notifications_count()
returns int
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select count(*)::int from public.notifications where recipient_id = auth.uid() and read_at is null
$$;

revoke execute on function app.notify(uuid, text, text, text, text, text, text, uuid, text, text, boolean, boolean) from public, anon, authenticated;
revoke execute on function public.mark_notifications_read(uuid[]), public.unread_notifications_count() from public, anon;
grant execute on function public.mark_notifications_read(uuid[]), public.unread_notifications_count() to authenticated;
