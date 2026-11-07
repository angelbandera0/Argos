select plan(43);

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
  ('op1', tests.create_user('operator', 'vis1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'cost@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'otr@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Visor'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Costos');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d2', 'stock', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d2', 'see_costs', false);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f2');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol');
insert into product_stock_settings (product_id, company_id, storable) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true), ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', false);
insert into currencies (id, company_id, code, name, symbol, active) values
  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000a1', 'DOP', 'Peso', 'RD$', true),
  ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000a1', 'USD', 'Dólar', 'US$', false),
  ('00000000-0000-0000-0000-0000000000b7', '00000000-0000-0000-0000-0000000000b2', 'DOP', 'Peso', 'RD$', true);

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';
insert into ctx select 'l2', id from locations where store_id = '00000000-0000-0000-0000-0000000000f2';
insert into ctx select 'lb', id from locations where company_id = '00000000-0000-0000-0000-0000000000b2' and kind = 'warehouse';

insert into ctx values ('lotA', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'purchase', null, 5, 'Saco 25 lb', 25, 12, '00000000-0000-0000-0000-0000000000a7', current_date));
insert into ctx values ('lotB', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 'direct_entry', null, 10, 'lb', 1, null, null, current_date));
insert into ctx values ('lotC', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l2'), 'transfer', (select v from ctx where k = 'lotA'), 2, 'lb', 1, null, null, current_date));
insert into ctx values ('lotD', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'purchase', null, 3, 'lb', 1, 5, '00000000-0000-0000-0000-0000000000a7', current_date));

select is((select remaining from lots where id = (select v from ctx where k = 'lotA')), 125.000, 'CA-01: 5 sacks of 25 lb give 125 lb remaining');
select is((select unit_cost from lot_costs where lot_id = (select v from ctx where k = 'lotA')), 12.000000, 'lot cost is stored apart');
select is((select m.type || ':' || m.qty_delta from stock_movements m where m.lot_id = (select v from ctx where k = 'lotA')), 'purchase_entry:125.000', 'the entry movement is positive');
select is((select c.unit_cost from movement_costs c join stock_movements m on m.id = c.movement_id where m.lot_id = (select v from ctx where k = 'lotA')), 12.000000, 'the movement carries its cost');
select is((select unit_cost from lot_costs where lot_id = (select v from ctx where k = 'lotB')), null, 'a null cost means unknown cost');
select is((select type from stock_movements where lot_id = (select v from ctx where k = 'lotC')), 'transfer_in', 'transfer origin writes a transfer_in');
select throws_ok($$select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'lw'), 'purchase', null, 1, 'lb', 1, null, null, current_date)$$, 'P0001', 'PRODUCT_NOT_STORABLE', 'a non-storable product is rejected');
select throws_ok($$select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'purchase', null, 0, 'lb', 1, null, null, current_date)$$, 'P0001', 'INVALID_QUANTITY', 'quantity must be positive');
select throws_ok($$select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lb'), 'purchase', null, 1, 'lb', 1, null, null, current_date)$$, 'P0001', 'INVALID_LOCATION', 'the location must belong to the company');
select throws_ok($$select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'purchase', null, 1, 'lb', 1, 1, '00000000-0000-0000-0000-0000000000a8', current_date)$$, 'P0001', 'INVALID_CURRENCY', 'an inactive currency is rejected');
select throws_ok($$select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'purchase', null, 1, 'lb', 1, 1, '00000000-0000-0000-0000-0000000000b7', current_date)$$, 'P0001', 'INVALID_CURRENCY', 'a currency of another company is rejected');
select throws_ok($$update stock_movements set qty_delta = 1 where lot_id = (select v from ctx where k = 'lotA')$$, '42501', 'MOVEMENT_IMMUTABLE', 'movements cannot be updated even by postgres');
select throws_ok($$delete from stock_movements where lot_id = (select v from ctx where k = 'lotA')$$, '42501', 'MOVEMENT_IMMUTABLE', 'movements cannot be deleted even by postgres');
select throws_ok($$update movement_costs set unit_cost = 1 where company_id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', 'MOVEMENT_IMMUTABLE', 'movement costs cannot be updated');
select throws_ok($$delete from movement_costs where company_id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', 'MOVEMENT_IMMUTABLE', 'movement costs cannot be deleted');
select throws_ok($$update lots set initial_qty = 1 where id = (select v from ctx where k = 'lotA')$$, '42501', 'LOT_IMMUTABLE', 'lot initial quantity is immutable');
select throws_ok($$update lots set product_id = '00000000-0000-0000-0000-0000000000e2' where id = (select v from ctx where k = 'lotA')$$, '42501', 'LOT_IMMUTABLE', 'lot product is immutable');
select lives_ok($$update lots set remaining = 120 where id = (select v from ctx where k = 'lotA')$$, 'remaining can decrease');
select throws_ok($$update lots set remaining = 130 where id = (select v from ctx where k = 'lotA')$$, '23514', null, 'remaining cannot exceed the initial quantity');
select is(app.product_has_stock('00000000-0000-0000-0000-0000000000e1'), true, 'a product with available lots has stock');
select throws_ok($$update product_stock_settings set base_unit = 'kg' where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'P0001', 'BASE_UNIT_IN_USE', 'the base unit is locked once there is stock');
select is(app.currency_in_use('00000000-0000-0000-0000-0000000000a7'), true, 'a currency with costs is in use');
select throws_ok($$update currencies set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000a7'$$, 'P0001', 'CURRENCY_IN_USE', 'an in-use currency cannot be deleted');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select count(*)::int from lots), 4, 'the admin reads the lots');
select is((select count(*)::int from lot_costs), 4, 'the admin reads lot costs');
select is((select count(*)::int from movement_costs), 4, 'the admin reads movement costs');
select is((select count(*)::int from stock_movements), 4, 'the admin reads the movements');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')), 123.000, 'stock_levels sums remaining per product and location');
select throws_ok($$insert into lots (company_id, product_id, location_id, origin, initial_qty, remaining, captured_qty, captured_unit, content, received_at) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'direct_entry', 1, 1, 1, 'lb', 1, current_date)$$, '42501', null, 'no direct insert into lots');
select throws_ok($$update lots set remaining = 1$$, '42501', null, 'no direct update of lots');
select throws_ok($$delete from stock_movements$$, '42501', null, 'no direct delete of movements');
select throws_ok($$insert into lot_costs (lot_id, company_id) values ((select v from ctx where k = 'lotA'), '00000000-0000-0000-0000-0000000000a1')$$, '42501', null, 'no direct insert into lot_costs');
select throws_ok($$select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'direct_entry', null, 1, 'lb', 1, null, null, current_date)$$, '42501', null, 'authenticated cannot run create_lot');
select tests.authenticate_as((select v from ctx where k = 'dan'));
select is((select count(*)::int from lots) + (select count(*)::int from stock_movements) + (select count(*)::int from lot_costs) + (select count(*)::int from movement_costs), 0, 'another company admin sees nothing');
select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select is((select count(*)::int from lots), 3, 'an operator sees lots of the warehouse and their store');
select is((select count(*)::int from stock_movements), 3, 'an operator sees movements of the warehouse and their store');
select is((select count(*)::int from lot_costs) + (select count(*)::int from movement_costs), 0, 'without see_costs no costs are visible');
select is((select count(*)::int from stock_levels), 2, 'stock_levels follows the visible locations');
select tests.authenticate_as((select v from ctx where k = 'op3'), 'aal1', '00000000-0000-0000-0000-0000000005a3');
select is((select count(*)::int from lots where location_id = (select v from ctx where k = 'l1')), 0, 'an operator of another store does not see foreign lots');
select tests.authenticate_as((select v from ctx where k = 'op2'), 'aal1', '00000000-0000-0000-0000-0000000005a2');
select is((select count(*)::int from lot_costs), 4, 'with see_costs the operator reads lot costs');
select is((select count(*)::int from movement_costs), 4, 'with see_costs the operator reads movement costs');
select tests.clear_auth();
select is((select count(*)::int from audit_log where company_id = '00000000-0000-0000-0000-0000000000a1' and module = 'stock' and entity_type = 'stock_movements' and action = 'create'), 4, 'movements are audited under the stock module');
select is((select count(*)::int from audit_log where entity_type = 'stock_movements' and (after ? 'unit_cost' or after ? 'currency_id')), 0, 'the audit trail holds no costs');

select * from finish();
