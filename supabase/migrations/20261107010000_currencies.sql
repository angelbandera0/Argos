create table public.currencies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  code text not null check (char_length(trim(code)) between 1 and 10),
  name text not null check (char_length(trim(name)) between 1 and 80),
  symbol text not null check (char_length(trim(symbol)) between 1 and 8),
  decimals smallint not null default 2 check (decimals between 0 and 4),
  is_default boolean not null default false,
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id)
);

create table public.currency_denominations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  currency_id uuid not null,
  value numeric not null check (value > 0),
  kind text not null check (kind in ('bill', 'coin')),
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (currency_id, company_id) references public.currencies (id, company_id)
);

create unique index currencies_code_key on public.currencies (company_id, lower(trim(code))) where deleted_at is null;
create unique index currencies_default_key on public.currencies (company_id) where is_default and deleted_at is null;
create unique index currency_denominations_value_key on public.currency_denominations (currency_id, value) where deleted_at is null;
create index currency_denominations_currency_idx on public.currency_denominations (currency_id, company_id);

create trigger currencies_touch before update on public.currencies for each row execute function app.touch_updated_at();
create trigger currency_denominations_touch before update on public.currency_denominations for each row execute function app.touch_updated_at();

create function app.currency_in_use(p_currency uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select false -- se amplía en T10/T19 con pedidos y lotes
$$;

create function app.guard_currency_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null
     and app.currency_in_use(case tg_table_name when 'currencies' then old.id else old.currency_id end) then
    raise exception 'CURRENCY_IN_USE';
  end if;
  return new;
end;
$$;

create function app.guard_currency_company()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.company_id is distinct from old.company_id then
    raise exception 'COMPANY_IMMUTABLE' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function app.single_default_currency()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.is_default and new.deleted_at is null then
    update public.currencies set is_default = false
    where company_id = new.company_id and is_default and deleted_at is null and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger currencies_delete_guard before update of deleted_at on public.currencies
  for each row execute function app.guard_currency_delete();
create trigger currency_denominations_delete_guard before update of deleted_at on public.currency_denominations
  for each row execute function app.guard_currency_delete();
create trigger currencies_company_guard before update on public.currencies
  for each row execute function app.guard_currency_company();
create trigger currency_denominations_company_guard before update on public.currency_denominations
  for each row execute function app.guard_currency_company();
create trigger currencies_single_default before insert or update of is_default on public.currencies
  for each row execute function app.single_default_currency();

revoke execute on function app.currency_in_use(uuid), app.guard_currency_delete(), app.guard_currency_company(), app.single_default_currency() from public, anon;
grant execute on function app.currency_in_use(uuid) to authenticated;

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

create trigger audit_currencies after insert or update on public.currencies for each row execute function app.audit_row();
create trigger audit_currency_denominations after insert or update on public.currency_denominations for each row execute function app.audit_row();

alter table public.currencies enable row level security;
alter table public.currency_denominations enable row level security;

revoke all on public.currencies, public.currency_denominations from anon, authenticated;
grant select on public.currencies, public.currency_denominations to authenticated;
grant insert (company_id, code, name, symbol, decimals, is_default, active) on public.currencies to authenticated;
grant update (code, name, symbol, decimals, is_default, active, deleted_at) on public.currencies to authenticated;
grant insert (company_id, currency_id, value, kind, active) on public.currency_denominations to authenticated;
grant update (value, kind, active, deleted_at) on public.currency_denominations to authenticated;

-- T04: ajustar a permiso del módulo divisas (hoy solo administradores escriben; operadores de la compañía leen)
create policy currencies_select on public.currencies for select to authenticated using (
  app.is_company_admin(company_id)
  or (deleted_at is null and company_id = (select app.operator_company()))
);
create policy currencies_insert on public.currencies for insert to authenticated with check (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id)
);
create policy currencies_update on public.currencies for update to authenticated
using (app.is_company_admin(company_id))
with check (app.is_company_admin(company_id));

create policy currency_denominations_select on public.currency_denominations for select to authenticated using (
  app.is_company_admin(company_id)
  or (deleted_at is null and company_id = (select app.operator_company()))
);
create policy currency_denominations_insert on public.currency_denominations for insert to authenticated with check (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id)
);
create policy currency_denominations_update on public.currency_denominations for update to authenticated
using (app.is_company_admin(company_id))
with check (app.is_company_admin(company_id));
