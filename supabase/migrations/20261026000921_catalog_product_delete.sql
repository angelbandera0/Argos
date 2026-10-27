create function public.delete_product(p_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cid uuid;
begin
  select company_id into cid from public.products where id = p_id and deleted_at is null;
  if cid is null or not app.can(cid, 'products', 'delete') then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  update public.products set deleted_at = now() where id = p_id;
end;
$$;

revoke execute on function public.delete_product(uuid) from public, anon;
grant execute on function public.delete_product(uuid) to authenticated;

drop policy products_update on public.products;

create policy products_update on public.products for update to authenticated
using (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'products', 'edit'))
)
with check (
  app.is_company_admin(company_id)
  or (deleted_at is null and app.can(company_id, 'products', 'edit'))
);

