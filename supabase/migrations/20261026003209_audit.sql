create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  module text not null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('create', 'update', 'deactivate', 'reactivate', 'delete')),
  actor_id uuid,
  store_id uuid,
  channel text not null check (channel in ('ui', 'api', 'app', 'mcp', 'system')),
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_company_idx on public.audit_log (company_id, created_at desc);

create table public.auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username_attempted text,
  event text not null check (event in ('login_ok', 'login_failed', 'locked', 'unlocked', 'pin_reset', 'password_changed')),
  actor_id uuid,
  channel text not null check (channel in ('ui', 'api', 'app', 'mcp', 'system')),
  created_at timestamptz not null default now(),
  check (user_id is not null or username_attempted is not null)
);

create index auth_events_user_idx on public.auth_events (user_id, created_at desc);

create function app.audit_row()
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
      when 'roles' then 'roles'
      when 'role_permissions' then 'roles'
      when 'role_company_exclusions' then 'roles'
      when 'profiles' then 'users'
      when 'user_stores' then 'users'
      else 'organization'
    end,
    tg_table_name,
    (case tg_table_name
      when 'company_admins' then n ->> 'admin_id'
      when 'role_permissions' then n ->> 'role_id'
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

create function app.forbid_audit_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'AUDIT_LOG_IMMUTABLE';
end;
$$;

create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function app.forbid_audit_change();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function app.forbid_audit_change();

create trigger audit_companies after insert or update on public.companies for each row execute function app.audit_row();
create trigger audit_company_admins after insert or update on public.company_admins for each row execute function app.audit_row();
create trigger audit_sites after insert or update on public.sites for each row execute function app.audit_row();
create trigger audit_stores after insert or update on public.stores for each row execute function app.audit_row();
create trigger audit_roles after insert or update on public.roles for each row execute function app.audit_row();
create trigger audit_role_permissions after insert or update on public.role_permissions for each row execute function app.audit_row();
create trigger audit_role_company_exclusions after insert or update on public.role_company_exclusions for each row execute function app.audit_row();
create trigger audit_user_stores after insert or update on public.user_stores for each row execute function app.audit_row();
create trigger audit_categories after insert or update on public.categories for each row execute function app.audit_row();
create trigger audit_products after insert or update on public.products for each row execute function app.audit_row();
create trigger audit_profiles after insert or update on public.profiles for each row execute function app.audit_row();

revoke execute on function app.audit_row(), app.forbid_audit_change() from public, anon;

alter table public.audit_log enable row level security;
alter table public.auth_events enable row level security;

revoke all on public.audit_log, public.auth_events from anon, authenticated;
grant select on public.audit_log, public.auth_events to authenticated;

create policy audit_log_select on public.audit_log for select to authenticated using (
  app.is_company_admin(company_id)
  or ((select app.kind()) = 'admin' and (select app.is_aal2()) and company_id is null and actor_id = (select auth.uid()))
  or app.can(company_id, module, 'view')
);

create policy auth_events_select on public.auth_events for select to authenticated using (
  (select app.is_superadmin())
  or exists (
    select 1 from public.profiles p
    where p.id = auth_events.user_id and p.company_id is not null and app.is_company_admin(p.company_id)
  )
);
