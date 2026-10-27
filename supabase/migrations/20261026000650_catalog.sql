create table public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  name text not null check (char_length(trim(name)) between 1 and 80),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, company_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  category_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text check (char_length(description) <= 500),
  active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, company_id) references public.categories (id, company_id)
);

create unique index categories_name_key on public.categories (company_id, lower(trim(name))) where deleted_at is null;
create unique index products_name_key on public.products (company_id, lower(trim(name))) where deleted_at is null;
create index products_category_idx on public.products (category_id, company_id);

create trigger categories_touch before update on public.categories for each row execute function app.touch_updated_at();
create trigger products_touch before update on public.products for each row execute function app.touch_updated_at();

create function app.guard_category_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.deleted_at is null and new.deleted_at is not null
     and exists (select 1 from public.products where category_id = old.id and deleted_at is null) then
    raise exception 'CATEGORY_HAS_PRODUCTS';
  end if;
  return new;
end;
$$;

create trigger categories_delete_guard before update of deleted_at on public.categories
  for each row execute function app.guard_category_delete();

revoke execute on function app.guard_category_delete() from public, anon;

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
        or exists (select 1 from public.profiles where company_id = p_id and deleted_at is null)
        or exists (select 1 from public.categories where company_id = p_id and deleted_at is null)
        or exists (select 1 from public.products where company_id = p_id and deleted_at is null);
    when 'site' then
      return exists (select 1 from public.stores where site_id = p_id and deleted_at is null);
    when 'store' then
      return exists (select 1 from public.user_stores where store_id = p_id);
    else
      raise exception 'Unknown level %', p_level;
  end case;
end;
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;

revoke all on public.categories, public.products from anon, authenticated;
grant select on public.categories, public.products to authenticated;
grant insert (company_id, name) on public.categories to authenticated;
grant update (name, deleted_at) on public.categories to authenticated;
grant insert (company_id, category_id, name, description, active) on public.products to authenticated;
grant update (category_id, name, description, active, deleted_at) on public.products to authenticated;

create policy categories_select on public.categories for select to authenticated using (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'products', 'view'))
);

create policy categories_insert on public.categories for insert to authenticated with check (
  (select app.kind()) = 'admin' and app.is_company_admin(company_id)
);

create policy categories_update on public.categories for update to authenticated
using (app.is_company_admin(company_id))
with check (app.is_company_admin(company_id));

create policy products_select on public.products for select to authenticated using (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'products', 'view'))
);

create policy products_insert on public.products for insert to authenticated with check (
  ((select app.kind()) = 'admin' and app.is_company_admin(company_id))
  or (deleted_at is null and app.can(company_id, 'products', 'create'))
);

create policy products_update on public.products for update to authenticated
using (
  app.is_company_admin(company_id)
  or (deleted_at is null and (app.can(company_id, 'products', 'edit') or app.can(company_id, 'products', 'delete')))
)
with check (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'products', 'edit'))
  or (deleted_at is not null and app.can(company_id, 'products', 'delete'))
);
