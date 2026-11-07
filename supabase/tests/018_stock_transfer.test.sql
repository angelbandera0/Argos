select plan(37);

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
  ('w1', tests.create_user('operator', 'tr1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w2', tests.create_user('operator', 'tr2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w3', tests.create_user('operator', 'tr3@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('w4', tests.create_user('operator', 'tr4@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Traslado'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'SinFlag'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'TrasladoElige'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'Tienda');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d2', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d3', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d4', 'stock', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'transfer', true),
  ('00000000-0000-0000-0000-0000000000d2', 'transfer', false),
  ('00000000-0000-0000-0000-0000000000d3', 'transfer', true),
  ('00000000-0000-0000-0000-0000000000d3', 'choose_lot', true);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'w1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'w2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'w3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'w4'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'w1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'w2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'w3'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a4', (select v from ctx where k = 'w4'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', false);
insert into product_movement_units (company_id, product_id, name, equivalence) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Porción', 0.2);
insert into currencies (id, company_id, code, name, symbol, active) values
  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000a1', 'DOP', 'Peso', 'RD$', true);

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';
insert into ctx select 'lbw', id from locations where company_id = '00000000-0000-0000-0000-0000000000b2' and kind = 'warehouse';

insert into ctx values
  ('la', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 5, 'lb', 1, 10, '00000000-0000-0000-0000-0000000000a7', date '2026-01-01')),
  ('lbb', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 10, 'lb', 1, 12, '00000000-0000-0000-0000-0000000000a7', date '2026-02-01')),
  ('lc', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 20, 'lb', 1, null, null, date '2026-03-01')),
  ('ls', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 'direct_entry', null, 4, 'lb', 1, null, null, date '2026-01-01'));

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 10, 'porción'))->>'moved_base', '2.000', 'CA-02: 10 portions of 0.200 lb move 2.000 lb');
select is((select remaining from lots where id = (select v from ctx where k = 'la')), 3.000, 'the oldest lot is discounted');
select is(jsonb_array_length(public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 4, 'base')->'lots'), 2, 'a transfer spans two lots when needed');
select is((select remaining from lots where id = (select v from ctx where k = 'la')), 0.000, 'the first lot is drained');
select is((select remaining from lots where id = (select v from ctx where k = 'lbb')), 9.000, 'the second lot gives the rest');
select is((select count(*)::int from lots where source_lot_id = (select v from ctx where k = 'la')), 2, 'one destination lot per transfer and source lot');
select is((select count(*)::int from lots d join lot_costs c on c.lot_id = d.id
  where d.source_lot_id = (select v from ctx where k = 'lbb') and c.unit_cost = 12 and c.currency_id = '00000000-0000-0000-0000-0000000000a7'
    and d.received_at = date '2026-02-01' and d.initial_qty = 1.000 and d.location_id = (select v from ctx where k = 'l1')), 1, 'the destination lot keeps cost, currency and date');
select is((select sum(qty_delta) from stock_movements where lot_id = (select v from ctx where k = 'la') and type = 'transfer_out'), -5.000, 'transfer_out movements are negative');
select is((select sum(m.qty_delta) from stock_movements m join lots d on d.id = m.lot_id where d.source_lot_id = (select v from ctx where k = 'la') and m.type = 'transfer_in'), 5.000, 'transfer_in movements are positive');
select is((select count(*)::int from stock_movements where lot_id in (select v from ctx where k in ('la', 'lbb')) and type = 'transfer_out'), 3, 'one transfer_out per lot used');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')), 29.000, 'warehouse stock level');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'l1')), 10.000, 'store stock level');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1000, 'base')$$, 'P0001', 'INSUFFICIENT_STOCK', 'not enough stock');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')), 29.000, 'a failed transfer changes nothing');
select lives_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 5, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lbb'), 'qty', 5)))$$, 'a pick equal to FIFO is accepted');
select is((select count(*)::int from stock_movements where company_id = '00000000-0000-0000-0000-0000000000a1' and reason_code = 'fifo_deviation'), 0, 'no deviation recorded for the FIFO pick');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 5, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lbb'), 'qty', 5)))$$, 'P0001', 'LOT_EXCEEDED', 'a pick above the remaining');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 3, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lbb'), 'qty', 2)))$$, 'P0001', 'QUANTITY_MISMATCH', 'picks must add up');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base', jsonb_build_array(jsonb_build_object('lot_id', gen_random_uuid(), 'qty', 1)))$$, 'P0001', 'LOT_NOT_FOUND', 'unknown lot');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'ls'), 'qty', 1)))$$, 'P0001', 'LOT_NOT_FOUND', 'a lot of another location');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 2, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lbb'), 'qty', 1), jsonb_build_object('lot_id', (select v from ctx where k = 'lbb'), 'qty', 1)))$$, 'P0001', 'DUPLICATE_LOT', 'repeated lot');
select lives_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 5, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lc'), 'qty', 5)), 'Cliente pidio')$$, 'an admin may choose another lot');
select is((select count(*)::int from stock_movements where lot_id = (select v from ctx where k = 'lc') and type = 'transfer_out' and reason_code = 'fifo_deviation' and reason_text = 'Cliente pidio'), 1, 'the deviation is recorded with its reason');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'Caja')$$, 'P0001', 'INVALID_UNIT', 'unknown unit');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), (select v from ctx where k = 'l1'), 1, 'base')$$, 'P0001', 'NOT_WAREHOUSE', 'the origin must be the warehouse');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'lw'), 1, 'base')$$, 'P0001', 'NOT_STORE', 'the destination must be a store');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'lbw'), 1, 'base')$$, 'P0001', 'LOCATION_NOT_FOUND', 'a destination of another company');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base')$$, 'P0001', 'PRODUCT_NOT_STORABLE', 'a non-storable product');

select tests.authenticate_as((select v from ctx where k = 'w1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lc'), 'qty', 1)))$$, '42501', 'CHOOSE_LOT_FORBIDDEN', 'choosing a lot needs choose_lot');
select lives_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base')$$, 'a warehouse operator with transfer can move by FIFO');
select tests.authenticate_as((select v from ctx where k = 'w2'), 'aal1', '00000000-0000-0000-0000-0000000005a2');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base')$$, '42501', 'FORBIDDEN', 'without the warehouse flag it is forbidden');
select tests.authenticate_as((select v from ctx where k = 'w3'), 'aal1', '00000000-0000-0000-0000-0000000005a3');
select lives_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base', jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lc'), 'qty', 1)))$$, 'choose_lot with warehouse allows a deviation');
select tests.authenticate_as((select v from ctx where k = 'w4'), 'aal1', '00000000-0000-0000-0000-0000000005a4');
select throws_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 1, 'base')$$, '42501', 'FORBIDDEN', 'a store viewer cannot transfer');
select ok((select count(*) from lots where location_id = (select v from ctx where k = 'l1') and origin = 'transfer') > 0, 'the receiving store reads its destination lots');
select is((select count(*)::int from lot_costs where company_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'the receiver does not see costs');
select throws_ok($$select app.consume_lots('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, null, 'transfer_out', null, null, null, null, true, null)$$, '42501', null, 'the internal function is not callable');
select tests.clear_auth();
select throws_ok($$update stock_movements set qty_delta = -1 where type = 'transfer_out' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', 'MOVEMENT_IMMUTABLE', 'movements stay immutable');

select * from finish();
