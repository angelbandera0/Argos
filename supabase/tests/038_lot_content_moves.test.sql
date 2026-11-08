select plan(10);

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

select tests.authenticate_as((select v from ctx where k = 'ana'));
select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 3, 'saco', 40, p_received => current_date - 2);
select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 4, 'saco', 25, p_received => current_date - 1);
select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 7, 'Conteo suelto');

select is((public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 4, 'saco'))->>'moved_base', '145.000', '4 sacks = 3 x 40 + 1 x 25 by each lot content');
select is((select string_agg(asked_qty::text, ',' order by qty_delta) from stock_movements where type = 'transfer_out' and asked_unit = 'Saco'), '3.000,1.000', 'each movement records its packs');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 4, 'saco')$$, 'P0001', 'INSUFFICIENT_PACKS', 'only 3 complete sacks remain (bulk excluded)');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1.5, 'saco')$$, 'P0001', 'INVALID_QUANTITY', 'whole sacks only');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'saco', (select id from write_off_reasons order by code limit 1), 'x', jsonb_build_array(jsonb_build_object('lot_id', (select id from lots where location_id = (select v from ctx where k = 'lw') and presentation_content = 40), 'qty', 40)))$$, 'P0001', 'LOT_EXCEEDED', 'a pick cannot exceed the lot remaining');
select is((public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 2, 'saco', (select id from write_off_reasons order by code limit 1), 'x', jsonb_build_array(jsonb_build_object('lot_id', (select id from lots where location_id = (select v from ctx where k = 'lw') and presentation_content = 25), 'qty', 50))))->>'removed_base', '50.000', 'chosen lot: 2 sacks of 25');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 2, 'saco', (select id from write_off_reasons order by code limit 1), 'x', jsonb_build_array(jsonb_build_object('lot_id', (select id from lots where location_id = (select v from ctx where k = 'lw') and presentation_content = 25), 'qty', 25)))$$, 'P0001', 'QUANTITY_MISMATCH', 'picks must add up to the sacks asked');

select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 2, 'Sobrante sacos', null, null, 'saco', 30);
select is((select initial_qty || ' ' || presentation_name || ' ' || presentation_content from lots where origin = 'adjustment' and presentation_content = 30), '60.000 Saco 30.000', 'surplus by presentation keeps the given content');
select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 10, 'Sobrante kg', null, null, 'kg');
select is((select initial_qty from lots where captured_unit = 'kg'), 22.050::numeric, 'surplus in kg converts to base');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'Sobrante', null, null, 'metro')$$, 'P0001', 'INVALID_UNIT', 'unknown unit');

select tests.clear_auth();
select * from finish();
