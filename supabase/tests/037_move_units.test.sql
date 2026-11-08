select plan(8);

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
insert into product_presentations (company_id, product_id, name, content) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Saco', 40);
insert into product_movement_units (company_id, product_id, name, equivalence) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Porción', 0.2);

select tests.authenticate_as((select v from ctx where k = 'ana'));
select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 20, 'saco', 40);

select is((public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 5, 'saco'))->>'moved_base', '200.000', '5 sacks move 200 lb');
select is((select asked_qty || ' ' || asked_unit from stock_movements where type = 'transfer_out' and qty_delta = -200), '5.000 Saco', 'the movement records how it was asked');
select is((public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 10, 'kg'))->>'moved_base', '22.046', '10 kg convert to lb');
select is((public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 10, 'porción'))->>'moved_base', '2.000', '10 portions move 2 lb');
select is((select count(*)::int from stock_movements where type = 'transfer_in' and asked_unit = 'Saco'), 1, 'the entry side keeps the asked unit');
select is((public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base'))->>'moved_base', '1.000', 'base keeps working');
select is((select count(*)::int from stock_movements where type = 'transfer_out' and qty_delta = -1 and asked_qty is not null), 0, 'base leaves no asked unit');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1000, 'saco')$$, 'P0001', 'INSUFFICIENT_PACKS', 'more than there is');

select tests.clear_auth();
select * from finish();
