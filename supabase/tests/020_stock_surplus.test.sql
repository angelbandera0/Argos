select plan(29);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('dan', tests.create_user('admin', 'dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));

insert into ctx values
  ('o1', tests.create_user('operator', 'sp1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o2', tests.create_user('operator', 'sp2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o3', tests.create_user('operator', 'sp3@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o4', tests.create_user('operator', 'sp4@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'SobranteAlm'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'SobranteAlmCostos'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'SobranteTienda'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'Ver');
insert into role_permissions (role_id, module, can_view)
select r, 'stock', true from unnest(array['00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2',
  '00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d4']::uuid[]) r;
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'adjust_stock', true),
  ('00000000-0000-0000-0000-0000000000d2', 'adjust_stock', true),
  ('00000000-0000-0000-0000-0000000000d2', 'see_costs', false),
  ('00000000-0000-0000-0000-0000000000d3', 'adjust_stock', false);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'o1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'o2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'o3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'o4'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005d1', (select v from ctx where k = 'o1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005d2', (select v from ctx where k = 'o2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005d3', (select v from ctx where k = 'o3'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005d4', (select v from ctx where k = 'o4'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', false);
insert into currencies (id, company_id, code, name, symbol, active) values
  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000a1', 'DOP', 'Peso', 'RD$', true);

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';
insert into ctx select 'l2', id from locations where store_id = '00000000-0000-0000-0000-0000000000f2';
insert into ctx select 'lb', id from locations where company_id = '00000000-0000-0000-0000-0000000000b2' and kind = 'warehouse';

select tests.authenticate_as((select v from ctx where k = 'ana'));
insert into ctx values ('s1', public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 7, 'Conteo de enero'));
select is((select count(*)::int from lots where id = (select v from ctx where k = 's1') and origin = 'adjustment' and remaining = 7 and initial_qty = 7), 1, 'a surplus is a new lot of origin adjustment');
select is((select count(*)::int from lot_costs where lot_id = (select v from ctx where k = 's1') and unit_cost is null and currency_id is null), 1, 'no cost means unknown cost');
select is((select count(*)::int from stock_movements where lot_id = (select v from ctx where k = 's1') and type = 'adjustment' and qty_delta = 7 and reason_code = 'surplus' and reason_text = 'Conteo de enero'), 1, 'the movement is a positive adjustment with reason surplus');
select is((select received_at from lots where id = (select v from ctx where k = 's1')), current_date, 'the lot is dated today');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')), 7.000, 'stock_levels reflects the surplus');
select is((select count(*)::int from notifications where actor_id = (select v from ctx where k = 'ana')), 0, 'an admin surplus notifies nobody');
insert into ctx values ('s2', public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 3, 'Conteo con costo', 3.5, '00000000-0000-0000-0000-0000000000a7'));
select is((select unit_cost from lot_costs where lot_id = (select v from ctx where k = 's2')), 3.500000, 'an admin may send a cost');

select tests.authenticate_as((select v from ctx where k = 'o1'), 'aal1', '00000000-0000-0000-0000-0000000005d1');
insert into ctx values ('s3', public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 2, 'Conteo almacén'));
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'Con costo', 5, '00000000-0000-0000-0000-0000000000a7')$$, '42501', 'COST_NOT_ALLOWED', 'a keeper without see_costs cannot send a cost');
select tests.authenticate_as((select v from ctx where k = 'o2'), 'aal1', '00000000-0000-0000-0000-0000000005d2');
insert into ctx values ('s4', public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 4, 'Conteo con costos', 9.25, '00000000-0000-0000-0000-0000000000a7'));
select tests.authenticate_as((select v from ctx where k = 'o3'), 'aal1', '00000000-0000-0000-0000-0000000005d3');
insert into ctx values ('s5', public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 6, 'Conteo tienda'));
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l2'), 1, 'Conteo')$$, '42501', 'FORBIDDEN', 'not in another store');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'Conteo')$$, '42501', 'FORBIDDEN', 'not in the warehouse without the flag');
select tests.authenticate_as((select v from ctx where k = 'o4'), 'aal1', '00000000-0000-0000-0000-0000000005d4');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 1, 'Conteo')$$, '42501', 'FORBIDDEN', 'no permission');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'ab')$$, 'P0001', 'REASON_TEXT_REQUIRED', 'the reason needs 3 characters');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, '   ')$$, 'P0001', 'REASON_TEXT_REQUIRED', 'a blank reason is rejected');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, null)$$, 'P0001', 'REASON_TEXT_REQUIRED', 'the reason is mandatory');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 0, 'Conteo')$$, 'P0001', 'INVALID_QUANTITY', 'zero quantity');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), -1, 'Conteo')$$, 'P0001', 'INVALID_QUANTITY', 'negative quantity');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'lw'), 1, 'Conteo')$$, 'P0001', 'PRODUCT_NOT_STORABLE', 'a non-storable product');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', gen_random_uuid(), 1, 'Conteo')$$, 'P0001', 'LOCATION_NOT_FOUND', 'unknown location');
select throws_ok($$select public.register_surplus('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lb'), 1, 'Conteo')$$, '42501', 'FORBIDDEN', 'a location of another company');
select tests.clear_auth();

select is((select count(*)::int from notifications where recipient_id = (select v from ctx where k = 'ana') and module = 'stock' and operation = 'surplus'), 3, 'the admin gets one notification per non-admin surplus');
select is((select count(*)::int from notifications where company_id = '00000000-0000-0000-0000-0000000000a1' and operation = 'surplus' and recipient_id not in (select v from ctx where k = 'ana')), 0, 'only admins are notified');
select is((select count(*)::int from notifications where company_id = '00000000-0000-0000-0000-0000000000a1' and operation = 'surplus' and (title || body) ~ '(9[.,]25|3[.,]5)'), 0, 'notifications carry no costs');
select is((select lc.unit_cost from lot_costs lc where lc.lot_id = (select v from ctx where k = 's4')), 9.250000, 'see_costs allows a cost');
select is((select count(*)::int from lots where id = (select v from ctx where k = 's5') and origin = 'adjustment' and remaining = 6), 1, 'a store surplus creates a store lot');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')), 16.000, 'stock_levels sums the warehouse');
select throws_ok($$update stock_movements set qty_delta = 1 where lot_id = (select v from ctx where k = 's1')$$, '42501', 'MOVEMENT_IMMUTABLE', 'movements stay immutable');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_initial_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'lb', 1)$$, 'regression: initial entry');
select lives_ok($$select public.register_direct_entry('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 1, 'lb', 1)$$, 'regression: direct entry');
select is((public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l2'), 2, 'base'))->>'moved_base', '2.000', 'regression: transfer works with surplus lots');
select tests.clear_auth();
select * from finish();
