select plan(14);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'lca-ana@test.dev'));
insert into companies (id, name, code, founder_id) values ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana'));
insert into company_admins (company_id, admin_id, granted_by) values ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));
insert into ctx values
  ('op1', tests.create_user('operator', 'lca-1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'lca-2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'lca-3@test.dev', '00000000-0000-0000-0000-0000000000a1'));
insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');
insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Ambos'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Solo costos'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'Nada');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d1', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d2', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d3', 'stock', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'see_costs', false),
  ('00000000-0000-0000-0000-0000000000d1', 'correct_orders', false),
  ('00000000-0000-0000-0000-0000000000d2', 'see_costs', false);
insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f1');
insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz');
insert into product_stock_settings (product_id, company_id, storable) values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true);
insert into currencies (id, company_id, code, name, symbol, active) values ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000a1', 'DOP', 'Peso', 'RD$', true);
insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx values ('lot', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'purchase', null, 10, 'lb', 1, 12, '00000000-0000-0000-0000-0000000000a7', current_date));
insert into ctx values ('lot0', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'direct_entry', null, 10, 'lb', 1, null, null, current_date));

select tests.authenticate_as((select v from ctx where k = 'op3'), 'aal2', '00000000-0000-0000-0000-0000000005a3');
select throws_ok(format($$select public.adjust_lot_cost('%s', 15, 'error de compra')$$, (select v from ctx where k = 'lot')), '42501', 'FORBIDDEN', 'denied without permissions');
select tests.authenticate_as((select v from ctx where k = 'op2'), 'aal2', '00000000-0000-0000-0000-0000000005a2');
select throws_ok(format($$select public.adjust_lot_cost('%s', 15, 'error de compra')$$, (select v from ctx where k = 'lot')), '42501', 'FORBIDDEN', 'see_costs alone is denied');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal2', '00000000-0000-0000-0000-0000000005a1');
select lives_ok(format($$select public.adjust_lot_cost('%s', 15, 'error de compra')$$, (select v from ctx where k = 'lot')), 'see_costs + correct_orders is allowed');
select throws_ok(format($$select public.adjust_lot_cost('%s', 15, '  ')$$, (select v from ctx where k = 'lot')), 'P0001', 'REASON_TEXT_REQUIRED', 'reason is required');
select throws_ok(format($$select public.adjust_lot_cost('%s', -1, 'motivo')$$, (select v from ctx where k = 'lot')), 'P0001', 'INVALID_COST', 'negative cost rejected');
select throws_ok(format($$select public.adjust_lot_cost('%s', null, 'motivo')$$, (select v from ctx where k = 'lot')), 'P0001', 'INVALID_COST', 'null cost is not invented');
select throws_ok(format($$select public.adjust_lot_cost('%s', 1.1234567, 'motivo')$$, (select v from ctx where k = 'lot')), 'P0001', 'INVALID_COST', 'more than 6 decimals rejected');
select throws_ok(format($$select public.adjust_lot_cost('%s', 5, 'motivo')$$, (select v from ctx where k = 'lot0')), 'P0001', 'CURRENCY_REQUIRED', 'unknown-cost lot without currency');
select is((select old_unit_cost || '>' || new_unit_cost from lot_cost_adjustments), '12.000000>15.000000', 'the adjustment keeps the previous cost');
select throws_ok($$update lot_cost_adjustments set reason = 'x again'$$, '42501', 'permission denied for table lot_cost_adjustments', 'adjustments are immutable');

select tests.authenticate_as((select v from ctx where k = 'ana'), 'aal2');
select lives_ok(format($$select public.adjust_lot_cost('%s', 16.5, 'segunda corrección')$$, (select v from ctx where k = 'lot')), 'admin allowed');
select is((select unit_cost from lot_costs where lot_id = (select v from ctx where k = 'lot')), 16.500000, 'lot_costs holds the new value');
select is((select c.unit_cost from movement_costs c join stock_movements m on m.id = c.movement_id where m.lot_id = (select v from ctx where k = 'lot')), 12.000000, 'earlier movements keep their cost');

select tests.authenticate_as((select v from ctx where k = 'op3'), 'aal2', '00000000-0000-0000-0000-0000000005a3');
select is((select count(*)::int from lot_cost_adjustments), 0, 'adjustments hidden without see_costs');

select tests.clear_auth();
select * from finish();
