select plan(65);

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
  ('o1', tests.create_user('operator', 'wo1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o2', tests.create_user('operator', 'wo2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o3', tests.create_user('operator', 'wo3@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o4', tests.create_user('operator', 'wo4@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o5', tests.create_user('operator', 'wo5@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o6', tests.create_user('operator', 'wo6@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'BajaAlm'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'BajaTienda'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'Ver'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'BajaElige'),
  ('00000000-0000-0000-0000-0000000000d5', (select v from ctx where k = 'ana'), 'AjusteAlm'),
  ('00000000-0000-0000-0000-0000000000d6', (select v from ctx where k = 'ana'), 'AjusteTienda');
insert into role_permissions (role_id, module, can_view)
select r, 'stock', true from unnest(array['00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2',
  '00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000d5',
  '00000000-0000-0000-0000-0000000000d6']::uuid[]) r;
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'write_off', true),
  ('00000000-0000-0000-0000-0000000000d2', 'write_off', false),
  ('00000000-0000-0000-0000-0000000000d4', 'write_off', true),
  ('00000000-0000-0000-0000-0000000000d4', 'choose_lot', true),
  ('00000000-0000-0000-0000-0000000000d5', 'adjust_stock', true),
  ('00000000-0000-0000-0000-0000000000d6', 'adjust_stock', false);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'o1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'o2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'o3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'o4'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4'),
  ((select v from ctx where k = 'o5'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d5'),
  ((select v from ctx where k = 'o6'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d6');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005c1', (select v from ctx where k = 'o1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005c2', (select v from ctx where k = 'o2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005c3', (select v from ctx where k = 'o3'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005c4', (select v from ctx where k = 'o4'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005c5', (select v from ctx where k = 'o5'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005c6', (select v from ctx where k = 'o6'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz');
insert into product_stock_settings (product_id, company_id, storable) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true);
insert into product_movement_units (company_id, product_id, name, equivalence) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', 'Porción', 0.2);
insert into currencies (id, company_id, code, name, symbol, active) values
  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000a1', 'DOP', 'Peso', 'RD$', true);

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';
insert into ctx select 'l2', id from locations where store_id = '00000000-0000-0000-0000-0000000000f2';
insert into ctx select 'rw', id from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and code = 'waste';
insert into ctx select 'ro', id from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and code = 'other';
insert into ctx select 'rx', id from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and code = 'expired';
insert into ctx select 'rd', id from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and code = 'damaged';
insert into ctx select 'rb', id from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000b2' and code = 'waste';

insert into ctx values
  ('la', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 5, 'lb', 1, 10, '00000000-0000-0000-0000-0000000000a7', date '2026-01-01')),
  ('lb', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 10, 'lb', 1, 12, '00000000-0000-0000-0000-0000000000a7', date '2026-02-01')),
  ('lc', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 20, 'lb', 1, null, null, date '2026-03-01')),
  ('ls', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 'direct_entry', null, 4, 'lb', 1, null, null, date '2026-01-01')),
  ('ad', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 'direct_entry', null, 10, 'lb', 1, 8, '00000000-0000-0000-0000-0000000000a7', date '2026-06-01'));
update lots set remaining = 6 where id = (select v from ctx where k = 'ad');

select is((select count(*)::int from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and standard), 7, 'a new company gets the 7 standard reasons');
select is((select count(*)::int from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and requires_text and code = 'other'), 1, 'other requires text');
select is((select count(*)::int from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and requires_text), 1, 'only other requires text');
select is((select count(*)::int from companies c where (select count(*) from write_off_reasons r where r.company_id = c.id and r.standard) <> 7), 0, 'no company lacks the standard reasons (backfill)');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select throws_ok($$update write_off_reasons set name = 'X' where code = 'waste' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', 'STANDARD_REASON_LOCKED', 'a standard reason cannot be renamed');
select throws_ok($$update write_off_reasons set deleted_at = now() where code = 'waste' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', 'STANDARD_REASON_LOCKED', 'a standard reason cannot be deleted');
select throws_ok($$update write_off_reasons set active = false where code = 'other' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', 'STANDARD_REASON_LOCKED', 'other cannot be deactivated');
select throws_ok($$update write_off_reasons set code = 'zzz' where code = 'waste' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, '42501', null, 'the code is not updatable');
select lives_ok($$update write_off_reasons set active = false where code = 'expired' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, 'another standard reason can be deactivated');
select lives_ok($$insert into write_off_reasons (company_id, code, name) values ('00000000-0000-0000-0000-0000000000a1', 'promo', 'Promoción')$$, 'an admin adds an own reason');
select is((select standard or requires_text from write_off_reasons where code = 'promo' and company_id = '00000000-0000-0000-0000-0000000000a1'), false, 'an own reason is not standard');
select lives_ok($$update write_off_reasons set name = 'Promo 2' where code = 'promo' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, 'an own reason can be renamed');
select lives_ok($$update write_off_reasons set active = false where code = 'promo' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, 'an own reason can be deactivated');
select lives_ok($$update write_off_reasons set deleted_at = now() where code = 'promo' and company_id = '00000000-0000-0000-0000-0000000000a1'$$, 'an own reason can be deleted');
select throws_ok($$insert into write_off_reasons (company_id, code, name) values ('00000000-0000-0000-0000-0000000000a1', 'promo', 'Otra')$$, '23505', null, 'the code is unique per company');
select throws_ok($$insert into write_off_reasons (company_id, code, name, standard) values ('00000000-0000-0000-0000-0000000000a1', 'fake', 'Falso', true)$$, '42501', null, 'an admin cannot create standard reasons');
select ok((select count(*) from audit_log where entity_type = 'write_off_reasons' and company_id = '00000000-0000-0000-0000-0000000000a1') > 0, 'reasons are audited');
select is((public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 3, 'base', (select v from ctx where k = 'rw')))->>'removed_base', '3.000', 'CA-06: a write-off removes the quantity');
select is((select remaining from lots where id = (select v from ctx where k = 'la')), 2.000, 'the oldest lot is discounted (FIFO)');
select is((select count(*)::int from stock_movements m join movement_costs mc on mc.movement_id = m.id where m.lot_id = (select v from ctx where k = 'la') and m.type = 'write_off' and m.qty_delta = -3 and m.reason_code = 'waste' and m.reason_text = 'Merma' and mc.unit_cost = 10), 1, 'negative write_off movement with reason code and copied cost');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'ro'))$$, 'P0001', 'REASON_TEXT_REQUIRED', 'other needs a text');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'ro'), 'Se cayó')$$, 'other with a text');
select is((select count(*)::int from stock_movements where lot_id = (select v from ctx where k = 'la') and type = 'write_off' and reason_code = 'other' and reason_text = 'Se cayó'), 1, 'the text is stored');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rx'))$$, 'P0001', 'INVALID_REASON', 'an inactive reason');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rb'))$$, 'P0001', 'INVALID_REASON', 'a reason of another company');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'Caja', (select v from ctx where k = 'rw'))$$, 'P0001', 'INVALID_UNIT', 'unknown unit');
select is((public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 5, 'porción', (select v from ctx where k = 'rw')))->>'removed_base', '1.000', 'a movement unit is converted');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1000, 'base', (select v from ctx where k = 'rw'))$$, 'P0001', 'INSUFFICIENT_STOCK', 'not enough stock');
select is((select quantity from stock_levels where product_id = '00000000-0000-0000-0000-0000000000e1' and location_id = (select v from ctx where k = 'lw')), 30.000, 'a failed write-off changes nothing');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 2, 'base', (select v from ctx where k = 'rd'), null, jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lc'), 'qty', 2)), 'Pedido')$$, 'an admin may choose another lot');
select is((select count(*)::int from stock_movements where lot_id = (select v from ctx where k = 'lc') and type = 'write_off' and reason_code = 'damaged' and reason_text like '%fifo_deviation%'), 1, 'the deviation is recorded');
select tests.authenticate_as((select v from ctx where k = 'o1'), 'aal1', '00000000-0000-0000-0000-0000000005c1');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rw'), null, jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lc'), 'qty', 1)))$$, '42501', 'CHOOSE_LOT_FORBIDDEN', 'choosing a lot needs choose_lot');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rw'))$$, 'a warehouse operator with write_off can write off');
select tests.authenticate_as((select v from ctx where k = 'o2'), 'aal1', '00000000-0000-0000-0000-0000000005c2');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 1, 'base', (select v from ctx where k = 'rw'))$$, 'a store operator can write off in their store');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l2'), 1, 'base', (select v from ctx where k = 'rw'))$$, '42501', 'FORBIDDEN', 'not in another store');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rw'))$$, '42501', 'FORBIDDEN', 'not in the warehouse without the flag');
select tests.authenticate_as((select v from ctx where k = 'o3'), 'aal1', '00000000-0000-0000-0000-0000000005c3');
select throws_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'l1'), 1, 'base', (select v from ctx where k = 'rw'))$$, '42501', 'FORBIDDEN', 'no permission');
select is((select count(*)::int from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1'), 7, 'a stock viewer reads the active reasons');
select throws_ok($$insert into write_off_reasons (company_id, code, name) values ('00000000-0000-0000-0000-0000000000a1', 'mine', 'Mía')$$, '42501', null, 'an operator cannot add reasons');
update write_off_reasons set active = false where code = 'spill' and company_id = '00000000-0000-0000-0000-0000000000a1';
select is((select active from write_off_reasons where code = 'spill' and company_id = '00000000-0000-0000-0000-0000000000a1'), true, 'an operator cannot update reasons');
select tests.authenticate_as((select v from ctx where k = 'o4'), 'aal1', '00000000-0000-0000-0000-0000000005c4');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rw'), null, jsonb_build_array(jsonb_build_object('lot_id', (select v from ctx where k = 'lc'), 'qty', 1)))$$, 'choose_lot with warehouse allows a deviation');
select tests.authenticate_as((select v from ctx where k = 'o3'), 'aal1', '00000000-0000-0000-0000-0000000005c3');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), -1, 'Conteo')$$, '42501', 'FORBIDDEN', 'adjusting needs adjust_stock');
select tests.authenticate_as((select v from ctx where k = 'o2'), 'aal1', '00000000-0000-0000-0000-0000000005c2');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), -1, 'Conteo')$$, '42501', 'FORBIDDEN', 'write_off does not allow adjustments');
select tests.authenticate_as((select v from ctx where k = 'o6'), 'aal1', '00000000-0000-0000-0000-0000000005c6');
select lives_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), -1, 'Conteo')$$, 'a store adjuster can adjust a store lot');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'lb'), -1, 'Conteo')$$, '42501', 'FORBIDDEN', 'without the warehouse flag a warehouse lot is forbidden');
select tests.authenticate_as((select v from ctx where k = 'o5'), 'aal1', '00000000-0000-0000-0000-0000000005c5');
select lives_ok($$select public.register_adjustment((select v from ctx where k = 'lb'), -1, 'Conteo')$$, 'a warehouse adjuster can adjust a warehouse lot');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select remaining from lots where id = (select v from ctx where k = 'ad')), 5.000, 'the lot remaining follows the adjustment');
insert into ctx select 'adj1', public.register_adjustment((select v from ctx where k = 'ad'), -2, 'Merma por conteo');
select is((select remaining from lots where id = (select v from ctx where k = 'ad')), 3.000, 'a negative adjustment lowers the remaining');
select is((select count(*)::int from stock_movements m join movement_costs mc on mc.movement_id = m.id where m.id = (select v from ctx where k = 'adj1') and m.type = 'adjustment' and m.qty_delta = -2 and m.captured_qty = 2 and m.reason_code = 'adjustment' and m.reason_text = 'Merma por conteo' and mc.unit_cost = 8 and m.captured_unit = (select base_unit from product_stock_settings where product_id = '00000000-0000-0000-0000-0000000000e1')), 1, 'an adjustment movement copies the lot cost');
select lives_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), 2, 'Revierte conteo', (select v from ctx where k = 'adj1'))$$, 'a positive adjustment reversing a movement');
select is((select count(*)::int from stock_movements where reverses_id = (select v from ctx where k = 'adj1')), 1, 'reverses_id is stored');
select lives_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), 5, 'Recuento')$$, 'a positive adjustment up to the initial quantity');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), 1, 'Recuento')$$, 'P0001', 'ADJUST_EXCEEDS_LOT', 'an adjustment cannot exceed the lot initial quantity');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), -100, 'Recuento')$$, 'P0001', 'INSUFFICIENT_STOCK', 'an adjustment cannot go below zero');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), -1, 'ab')$$, 'P0001', 'REASON_TEXT_REQUIRED', 'the reason needs at least 3 characters');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), -1, null)$$, 'P0001', 'REASON_TEXT_REQUIRED', 'the reason is mandatory');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), 0, 'Nada')$$, 'P0001', 'INVALID_QUANTITY', 'the delta cannot be zero');
select throws_ok($$select public.register_adjustment((select v from ctx where k = 'ad'), -1, 'Revierte', (select id from stock_movements where lot_id = (select v from ctx where k = 'ls') limit 1))$$, 'P0001', 'INVALID_REVERSES', 'reverses must belong to the same lot');
select is((select remaining from lots where id = (select v from ctx where k = 'ad')), 10.000, 'failed adjustments change nothing');
select throws_ok($$insert into lots (company_id, product_id, location_id, origin, initial_qty, remaining, captured_qty, captured_unit, content, received_at) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'direct_entry', 1, 1, 1, 'lb', 1, now())$$, '42501', null, 'authenticated cannot insert lots');
select throws_ok($$update lots set remaining = 0 where id = (select v from ctx where k = 'ad')$$, '42501', null, 'authenticated cannot update lots');
select throws_ok($$update stock_movements set qty_delta = -9 where id = (select v from ctx where k = 'adj1')$$, '42501', null, 'authenticated cannot update movements');
select tests.clear_auth();
select throws_ok($$update stock_movements set qty_delta = -9 where id = (select v from ctx where k = 'adj1')$$, '42501', 'MOVEMENT_IMMUTABLE', 'movements stay immutable after an adjustment');
insert into companies (id, name, code, founder_id) values ('00000000-0000-0000-0000-0000000000c3', 'itest-wo', 'it01', (select v from ctx where k = 'ana'));
select is((select count(*)::int from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000c3'), 7, 'the test company is seeded');
select public.delete_test_company('00000000-0000-0000-0000-0000000000c3');
select is((select count(*)::int from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000c3'), 0, 'delete_test_company removes the reasons');
select * from finish();
