select plan(5);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values ('ana', tests.create_user('admin', 'ana@test.dev'));
insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));
insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');
insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true);
insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';

select tests.authenticate_as((select v from ctx where k = 'ana'));
insert into ctx values ('p', public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 20, 'saco', 40));
insert into ctx values ('b', public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 30, 'lb', 1));
select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 100, 'base');

select is((select presentation_name from lots where id = (select v from ctx where k = 'p')), 'saco', 'an entry by presentation remembers it');
select is((select presentation_content from lots where id = (select v from ctx where k = 'p')), 40.000, 'and its content');
select is((select presentation_name from lots where id = (select v from ctx where k = 'b')), null, 'a bulk entry has no presentation');
select is((select count(*)::int from lots where location_id = (select v from ctx where k = 'l1') and presentation_name = 'saco' and presentation_content = 40), 1, 'the store lot inherits the presentation');
select is((select sum(initial_qty) from lots where location_id = (select v from ctx where k = 'l1')), 100.000, 'the store received 100 lb in total');

select tests.clear_auth();
select * from finish();
