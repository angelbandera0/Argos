create table public.user_stores (
  user_id uuid not null,
  store_id uuid not null,
  company_id uuid not null,
  role_id uuid not null references public.roles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, store_id),
  foreign key (user_id, company_id) references public.profiles (id, company_id),
  foreign key (store_id, company_id) references public.stores (id, company_id)
);

create table public.app_sessions (
  session_id uuid primary key,
  user_id uuid not null references public.profiles (id),
  started_at timestamptz not null default now(),
  active_store_id uuid,
  ended_at timestamptz,
  foreign key (user_id, active_store_id) references public.user_stores (user_id, store_id)
);

create trigger user_stores_touch before update on public.user_stores for each row execute function app.touch_updated_at();

create function app.guard_user_store_role()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if exists (
    select 1 from public.role_company_exclusions
    where role_id = new.role_id and company_id = new.company_id
  ) then
    raise exception 'ROLE_EXCLUDED';
  end if;
  return new;
end;
$$;

create trigger user_stores_role_guard before insert or update of role_id, company_id on public.user_stores
  for each row execute function app.guard_user_store_role();

create function app.guard_active_store()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.active_store_id is not null
     and new.active_store_id is distinct from old.active_store_id
     and not app.is_operational(new.active_store_id) then
    raise exception 'STORE_NOT_OPERATIONAL';
  end if;
  return new;
end;
$$;

create trigger app_sessions_store_guard before update of active_store_id on public.app_sessions
  for each row execute function app.guard_active_store();

create function app.session_expiry(p_session uuid)
returns timestamptz
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select s.started_at + make_interval(secs => least(
    86400,
    coalesce(c.session_cap_seconds, 86400),
    coalesce(r.session_seconds, 86400)
  ))
  from public.app_sessions s
  left join public.user_stores us on us.user_id = s.user_id and us.store_id = s.active_store_id
  left join public.companies c on c.id = us.company_id
  left join public.roles r on r.id = us.role_id
  where s.session_id = p_session
$$;

create function app.session_active()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select s.ended_at is null and now() < app.session_expiry(s.session_id)
    from public.app_sessions s
    where s.session_id = (auth.jwt() ->> 'session_id')::uuid and s.user_id = auth.uid()
  ), false)
$$;

create function app.active_store()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select s.active_store_id
  from public.app_sessions s
  where s.session_id = (auth.jwt() ->> 'session_id')::uuid and s.user_id = auth.uid()
    and app.session_active()
$$;

create function app.can(p_company uuid, p_module text, p_op text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select coalesce((
    select case p_op
      when 'view' then rp.can_view
      when 'create' then rp.can_create
      when 'edit' then rp.can_edit
      when 'delete' then rp.can_delete
      else false
    end
    from public.user_stores us
    join public.roles r on r.id = us.role_id and r.deleted_at is null
    join public.role_permissions rp on rp.role_id = us.role_id and rp.module = p_module
    where app.kind() = 'operator'
      and us.user_id = auth.uid()
      and us.store_id = app.active_store()
      and us.company_id = p_company
      and app.is_operational(us.store_id)
      and not exists (
        select 1 from public.role_company_exclusions e
        where e.role_id = us.role_id and e.company_id = us.company_id
      )
  ), false)
$$;

revoke execute on function app.session_expiry(uuid), app.session_active(), app.active_store(), app.can(uuid, text, text),
  app.guard_user_store_role(), app.guard_active_store() from public, anon;
grant execute on function app.session_expiry(uuid), app.session_active(), app.active_store(), app.can(uuid, text, text) to authenticated;

create or replace function app.has_data(p_level text, p_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog
as $$
begin
  case p_level
    when 'company' then
      return exists (select 1 from public.sites where company_id = p_id and deleted_at is null)
        or exists (select 1 from public.profiles where company_id = p_id and deleted_at is null);
    when 'site' then
      return exists (select 1 from public.stores where site_id = p_id and deleted_at is null);
    when 'store' then
      return exists (select 1 from public.user_stores where store_id = p_id);
    else
      raise exception 'Unknown level %', p_level;
  end case;
end;
$$;

alter table public.user_stores enable row level security;
alter table public.app_sessions enable row level security;

create policy user_stores_select on public.user_stores for select to authenticated using (
  user_id = (select auth.uid()) or app.is_company_admin(company_id)
);

create policy user_stores_insert on public.user_stores for insert to authenticated with check (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id) and app.owns_role(role_id)
);

create policy user_stores_update on public.user_stores for update to authenticated
using ((select app.kind()) = 'admin' and app.is_company_admin(company_id) and app.owns_role(role_id))
with check ((select app.kind()) = 'admin' and app.is_company_admin(company_id) and app.owns_role(role_id));

create policy user_stores_delete on public.user_stores for delete to authenticated using (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id)
);

create policy app_sessions_select on public.app_sessions for select to authenticated using (
  user_id = (select auth.uid())
);

create policy app_sessions_insert on public.app_sessions for insert to authenticated with check (
  user_id = (select auth.uid()) and session_id = ((select auth.jwt()) ->> 'session_id')::uuid and active_store_id is null and ended_at is null
);

create policy app_sessions_update on public.app_sessions for update to authenticated
using (user_id = (select auth.uid()) and ended_at is null)
with check (user_id = (select auth.uid()));

revoke update on public.app_sessions from authenticated;
grant update (active_store_id, ended_at) on public.app_sessions to authenticated;

create policy stores_select_operator on public.stores for select to authenticated using (
  deleted_at is null
  and exists (select 1 from public.user_stores us where us.store_id = stores.id and us.user_id = (select auth.uid()))
  and (select app.session_active())
);

revoke insert on public.app_sessions from authenticated;
grant insert (session_id, user_id) on public.app_sessions to authenticated;
