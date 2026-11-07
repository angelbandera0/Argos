select plan(52);

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
  ('op1', tests.create_user('operator', 'cfg@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'ver@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'otr@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Configurador'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Visor');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d2', 'stock', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'configure_units', true),
  ('00000000-0000-0000-0000-0000000000d1', 'configure_minimums', false);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f2');

insert into categories (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol');

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';
insert into ctx select 'l2', id from locations where store_id = '00000000-0000-0000-0000-0000000000f2';

select is((select count(*)::int from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse' and name = 'Almacén general'), 1,
  'creating a company creates its general warehouse');
select is((select name from locations where store_id = '00000000-0000-0000-0000-0000000000f1'), 'Caja 1', 'creating a store creates its location with the store name');
select is((select count(*)::int from locations where company_id = '00000000-0000-0000-0000-0000000000a1'), 3, 'one warehouse plus one location per store');
select is((select count(*)::int from stores s where not exists (select 1 from locations l where l.store_id = s.id))
  + (select count(*)::int from companies c where not exists (select 1 from locations l where l.company_id = c.id and l.kind = 'warehouse')), 0,
  'every store and company has its location (backfill)');
select throws_ok($$insert into locations (company_id, kind, name) values ('00000000-0000-0000-0000-0000000000a1', 'warehouse', 'Otro')$$,
  '23505', null, 'only one general warehouse per company');
select throws_ok($$insert into locations (company_id, kind, store_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'store', '00000000-0000-0000-0000-0000000000f1', 'Dup')$$,
  '23505', null, 'only one location per store');
select throws_ok($$insert into locations (company_id, kind, name) values ('00000000-0000-0000-0000-0000000000b2', 'store', 'Sin tienda')$$,
  '23514', null, 'a store location needs a store');
select throws_ok($$insert into locations (company_id, kind, store_id, name) values ('00000000-0000-0000-0000-0000000000b2', 'store', '00000000-0000-0000-0000-0000000000f1', 'Cruzada')$$,
  '23503', null, 'the store must belong to the company');
select throws_ok($$update locations set kind = 'store' where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse'$$,
  '42501', null, 'location kind is immutable');
select throws_ok($$update locations set company_id = '00000000-0000-0000-0000-0000000000b2' where store_id = '00000000-0000-0000-0000-0000000000f1'$$,
  '42501', null, 'location company is immutable');
update stores set name = 'Caja Uno' where id = '00000000-0000-0000-0000-0000000000f1';
select is((select name from locations where store_id = '00000000-0000-0000-0000-0000000000f1'), 'Caja Uno', 'renaming the store renames its location');

select throws_ok($$insert into product_stock_settings (product_id, company_id, base_unit) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', 'gal')$$,
  '23514', null, 'a base unit outside the closed list is rejected');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true);
select is((select base_unit || ':' || magnitude from product_stock_settings where product_id = '00000000-0000-0000-0000-0000000000e1'), 'lb:weight', 'base unit defaults to lb');
update product_stock_settings set base_unit = 'ml' where product_id = '00000000-0000-0000-0000-0000000000e1';
select is((select magnitude from product_stock_settings where product_id = '00000000-0000-0000-0000-0000000000e1'), 'volume', 'magnitude follows the base unit');
select is(app.product_has_stock('00000000-0000-0000-0000-0000000000e1'), false, 'no stock until lots exist (T10)');
select throws_ok($$update product_stock_settings set company_id = '00000000-0000-0000-0000-0000000000b2' where product_id = '00000000-0000-0000-0000-0000000000e1'$$,
  '42501', null, 'settings company is immutable');

select throws_ok($$insert into product_presentations (company_id, product_id, name, content) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Saco', 0)$$,
  '23514', null, 'presentation content must be positive');
insert into product_presentations (id, company_id, product_id, name, content) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Saco', 50);
select throws_ok($$insert into product_presentations (company_id, product_id, name, content) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', ' SACO ', 25)$$,
  '23505', null, 'presentation names are unique per product ignoring case');
update product_presentations set deleted_at = now() where id = '00000000-0000-0000-0000-0000000000b1';
select lives_ok($$insert into product_presentations (company_id, product_id, name, content) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Saco', 25)$$,
  'a soft-deleted presentation name can be reused');
select throws_ok($$insert into product_movement_units (company_id, product_id, name, equivalence) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Porción', 0)$$,
  '23514', null, 'movement unit equivalence must be positive');
insert into product_movement_units (company_id, product_id, name, equivalence) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Porción', 0.2);
select throws_ok($$insert into product_movement_units (company_id, product_id, name, equivalence) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'porción', 1)$$,
  '23505', null, 'movement unit names are unique per product ignoring case');
select throws_ok($$insert into product_presentations (company_id, product_id, name, content) values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000e1', 'Cruzado', 1)$$,
  '23503', null, 'the product must belong to the company');

insert into stock_minimums (product_id, location_id, company_id, minimum) values
  ('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000a1', 10),
  ('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), '00000000-0000-0000-0000-0000000000a1', 5),
  ('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l2'), '00000000-0000-0000-0000-0000000000a1', 4);
select throws_ok($$insert into stock_minimums (product_id, location_id, company_id, minimum) values ('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000a1', -1)$$,
  '23514', null, 'a minimum cannot be negative');
select throws_ok($$insert into stock_minimums (product_id, location_id, company_id, minimum) values ('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000a1', 3)$$,
  '23505', null, 'one minimum per product and location');
select throws_ok($$insert into stock_minimums (product_id, location_id, company_id, minimum) values ('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000b2', 3)$$,
  '23503', null, 'minimum company must match product and location');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select count(*)::int from locations), 3, 'the admin reads the locations of their company');
select throws_ok($$insert into locations (company_id, kind, name) values ('00000000-0000-0000-0000-0000000000a1', 'warehouse', 'X')$$,
  '42501', null, 'no direct insert into locations');
select throws_ok($$update locations set name = 'X'$$, '42501', null, 'no direct update of locations');
select lives_ok($$insert into product_presentations (company_id, product_id, name, content) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', 'Bolsa', 2)$$,
  'the admin writes presentations');
select lives_ok($$insert into product_stock_settings (product_id, company_id, storable, base_unit) values ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', true, 'u')$$,
  'the admin writes the stock settings');
select lives_ok($$update stock_minimums set minimum = 12 where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')$$,
  'the admin writes minimums');
select is((select minimum from stock_minimums where location_id = (select v from ctx where k = 'lw')), 12.000, 'the admin update took effect');

select tests.authenticate_as((select v from ctx where k = 'dan'));
select is((select count(*)::int from locations) + (select count(*)::int from product_stock_settings) + (select count(*)::int from stock_minimums), 1,
  'another admin sees only their own warehouse location');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select is((select count(*)::int from locations), 2, 'an operator sees the warehouse and their store location only');
select lives_ok($$insert into product_presentations (company_id, product_id, name, content) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Caja', 12)$$,
  'configure_units with warehouse scope writes presentations');
select lives_ok($$insert into product_movement_units (company_id, product_id, name, equivalence) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Libra', 1)$$,
  'configure_units with warehouse scope writes movement units');
select lives_ok($$update product_presentations set deleted_at = now() where name = 'Caja'$$, 'and soft-deletes them');
select lives_ok($$insert into stock_minimums (product_id, location_id, company_id, minimum) values ('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'l1'), '00000000-0000-0000-0000-0000000000a1', 2)$$,
  'configure_minimums writes in the operator store');
select throws_ok($$insert into stock_minimums (product_id, location_id, company_id, minimum) values ('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'l2'), '00000000-0000-0000-0000-0000000000a1', 2)$$,
  '42501', null, 'configure_minimums does not reach other stores');
select throws_ok($$insert into stock_minimums (product_id, location_id, company_id, minimum) values ('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000a1', 2)$$,
  '42501', null, 'configure_minimums without the warehouse flag does not reach the warehouse');

select tests.authenticate_as((select v from ctx where k = 'op2'), 'aal1', '00000000-0000-0000-0000-0000000005a2');
select ok((select count(*) from product_stock_settings) > 0 and (select count(*) from product_presentations) > 0, 'stock view reads the product configuration');
select is((select count(*)::int from product_presentations where deleted_at is not null), 0, 'stock view does not see deleted presentations');
select is((select string_agg(minimum::text, ',' order by minimum) from stock_minimums), '2.000,5.000,12.000', 'stock view reads the minimums of the warehouse and their store only');
select throws_ok($$insert into product_presentations (company_id, product_id, name, content) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Paca', 5)$$,
  '42501', null, 'stock view alone cannot write presentations');
select throws_ok($$insert into product_stock_settings (product_id, company_id) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'stock view alone cannot write settings');
select throws_ok($$insert into stock_minimums (product_id, location_id, company_id, minimum) values ('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'l1'), '00000000-0000-0000-0000-0000000000a1', 9)$$,
  '42501', null, 'stock view alone cannot write minimums');

select tests.authenticate_as((select v from ctx where k = 'op3'), 'aal1', '00000000-0000-0000-0000-0000000005a3');
select is((select string_agg(minimum::text, ',' order by minimum) from stock_minimums), '4.000,12.000', 'an operator of another store does not see the minimums of other stores');

select tests.clear_auth();
select ok((select count(*) from audit_log where module = 'stock' and entity_type = 'stock_minimums' and entity_id = '00000000-0000-0000-0000-0000000000e1') >= 3,
  'minimums are audited under stock');
select ok(exists (select 1 from audit_log where module = 'stock' and entity_type = 'product_presentations' and action = 'delete'),
  'presentation soft-delete is audited');

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000c9', 'itest-sc', 'sc99', (select v from ctx where k = 'ana'));
insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c8', '00000000-0000-0000-0000-0000000000c9', 'S');
insert into stores (id, company_id, site_id, name) values ('00000000-0000-0000-0000-0000000000c7', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000c8', 'T');
insert into currencies (company_id, code, name, symbol) values ('00000000-0000-0000-0000-0000000000c9', 'MXN', 'Peso', '$');
insert into notifications (company_id, recipient_id, module, operation, priority, title, body)
  values ('00000000-0000-0000-0000-0000000000c9', (select v from ctx where k = 'ana'), 'stock', 'low', 'info', 't', 'b');
select is((select count(*)::int from locations where company_id = '00000000-0000-0000-0000-0000000000c9'), 2, 'the itest company got its locations');
set local role service_role;
select lives_ok($$select public.delete_test_company('00000000-0000-0000-0000-0000000000c9')$$, 'delete_test_company runs with the new tables');
reset role;
select is((select count(*)::int from locations where company_id = '00000000-0000-0000-0000-0000000000c9')
  + (select count(*)::int from currencies where company_id = '00000000-0000-0000-0000-0000000000c9')
  + (select count(*)::int from notifications where company_id = '00000000-0000-0000-0000-0000000000c9'), 0,
  'delete_test_company removes locations, currencies and notifications');

select * from finish();
