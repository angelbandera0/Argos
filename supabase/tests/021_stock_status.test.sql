select plan(53);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('bea', tests.create_user('admin', 'bea@test.dev')),
  ('dan', tests.create_user('admin', 'dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'bea'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));

insert into ctx values
  ('w1', tests.create_user('operator', 'ss-w1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('x1', tests.create_user('operator', 'ss-x1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('v1', tests.create_user('operator', 'ss-v1@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('v2', tests.create_user('operator', 'ss-v2@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('o3', tests.create_user('operator', 'ss-o3@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 2');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Atiende'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Ve'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'BajaTienda'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'BajaAlm');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000000000d2', 'stock', true),
  ('00000000-0000-0000-0000-0000000000d3', 'stock', true);
insert into role_special_permissions (role_id, permission, warehouse) values
  ('00000000-0000-0000-0000-0000000000d1', 'handle_requests', true),
  ('00000000-0000-0000-0000-0000000000d3', 'write_off', false),
  ('00000000-0000-0000-0000-0000000000d4', 'write_off', true),
  ('00000000-0000-0000-0000-0000000000d4', 'handle_requests', true);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'w1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'x1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4'),
  ((select v from ctx where k = 'v1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'v2'), '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'o3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005d1', (select v from ctx where k = 'x1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005d2', (select v from ctx where k = 'v2'), '00000000-0000-0000-0000-0000000000f2'),
  ('00000000-0000-0000-0000-0000000005d3', (select v from ctx where k = 'o3'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Frijol'),
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Sal'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Azúcar'),
  ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Aceite'),
  ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'Té');
insert into product_stock_settings (product_id, company_id, storable)
select p.id, p.company_id, true from products p where p.company_id = '00000000-0000-0000-0000-0000000000a1';

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000000000f1';
insert into ctx select 'l2', id from locations where store_id = '00000000-0000-0000-0000-0000000000f2';
insert into ctx select 'rw', id from write_off_reasons where company_id = '00000000-0000-0000-0000-0000000000a1' and code = 'waste';

insert into stock_minimums (product_id, location_id, company_id, minimum) values
  ('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000a1', 10),
  ('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'l1'), '00000000-0000-0000-0000-0000000000a1', 4),
  ('00000000-0000-0000-0000-0000000000e3', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000a1', 6),
  ('00000000-0000-0000-0000-0000000000e3', (select v from ctx where k = 'l2'), '00000000-0000-0000-0000-0000000000a1', 0),
  ('00000000-0000-0000-0000-0000000000e5', (select v from ctx where k = 'l2'), '00000000-0000-0000-0000-0000000000a1', 5),
  ('00000000-0000-0000-0000-0000000000e6', (select v from ctx where k = 'lw'), '00000000-0000-0000-0000-0000000000a1', 6);

insert into ctx values
  ('la', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 20, 'lb', 1, null, null, date '2026-01-01')),
  ('lf', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'l1'), 'direct_entry', null, 10, 'lb', 1, null, null, date '2026-01-01')),
  ('ls', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e3', (select v from ctx where k = 'lw'), 'initial_entry', null, 10, 'lb', 1, null, null, date '2026-01-01')),
  ('lz', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e4', (select v from ctx where k = 'lw'), 'initial_entry', null, 3, 'lb', 1, null, null, date '2026-01-01')),
  ('lt', app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e6', (select v from ctx where k = 'lw'), 'initial_entry', null, 2, 'lb', 1, null, null, date '2026-01-01'));

create temp view nt as
select n.recipient_id r, n.operation, n.priority, n.title, n.body, n.link, n.module, n.store_id
from notifications n where n.company_id = '00000000-0000-0000-0000-0000000000a1';
grant select on nt to public;

select is(app.stock_status(0, 5), 'out', 'zero is out');
select is(app.stock_status(5, 5), 'low', 'equal to the minimum is low');
select is(app.stock_status(6, 5), 'normal', 'above the minimum is normal');
select is(app.stock_status(5, null), 'normal', 'without a minimum it is normal');
select is(app.stock_status(0, null), 'out', 'zero without a minimum is out');
select is(app.stock_status(0, 0), 'out', 'zero with minimum zero is out');
select is(app.stock_status(1, 0), 'normal', 'above a zero minimum is normal');
select is(has_function_privilege('authenticated', 'app.stock_status(numeric, numeric)', 'execute') and not has_function_privilege('anon', 'app.stock_status(numeric, numeric)', 'execute'), true, 'stock_status is a pure function executable by authenticated (the view needs it) and not by anon');
select is(has_function_privilege('authenticated', 'app.notify_stock_status(uuid, uuid, uuid, numeric)', 'execute'), false, 'notify_stock_status is internal');
select is((select count(*)::int from nt), 0, 'entries do not notify');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select status from stock_status where product_id = '00000000-0000-0000-0000-0000000000e1'), 'normal', 'the view shows normal');
select is((select quantity from stock_status where product_id = '00000000-0000-0000-0000-0000000000e1'), 20.000, 'the view sums the lots');
select is((select minimum from stock_status where product_id = '00000000-0000-0000-0000-0000000000e1'), 10.000, 'the view shows the minimum');
select is((select status from stock_status where product_id = '00000000-0000-0000-0000-0000000000e6'), 'low', 'the view shows low');
select is((select status from stock_status where product_id = '00000000-0000-0000-0000-0000000000e5' and location_id = (select v from ctx where k = 'l2')), 'out', 'a minimum without lots is out');
select is((select status from stock_status where product_id = '00000000-0000-0000-0000-0000000000e3' and location_id = (select v from ctx where k = 'l2')), 'out', 'minimum zero without lots is out');
select ok((select minimum is null and status = 'normal' from stock_status where product_id = '00000000-0000-0000-0000-0000000000e4'), 'without a minimum the minimum is null');
select is((select count(*)::int from stock_status where product_id = '00000000-0000-0000-0000-0000000000e1'), 1, 'only locations with lots or a minimum');
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'stock_status' and column_name ~* 'cost|price|currency'), 0, 'the view has no cost columns');
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'stock_status'), 9, 'the view has the nine columns');
select is((select count(*)::int from stock_status where location_id = (select v from ctx where k = 'l1')), 1, 'an admin sees store locations');
select tests.authenticate_as((select v from ctx where k = 'v2'), 'aal1', '00000000-0000-0000-0000-0000000005d2');
select is((select count(*)::int from stock_status where location_id = (select v from ctx where k = 'l1')), 0, 'a store operator does not see another store');
select is((select count(*)::int from stock_status where location_id = (select v from ctx where k = 'l2')), 2, 'a store operator sees their store');
select is((select count(*)::int from stock_status where location_id = (select v from ctx where k = 'lw')), 4, 'a stock viewer sees the warehouse');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 5, 'base', (select v from ctx where k = 'rw'))$$, 'write-off staying normal');
select tests.clear_auth();
select is((select count(*)::int from nt where title like '%Arroz'), 0, 'staying normal does not notify');
select tests.authenticate_as((select v from ctx where k = 'x1'), 'aal1', '00000000-0000-0000-0000-0000000005d1');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 7, 'base', (select v from ctx where k = 'rw'))$$, 'write-off crossing the minimum');
select tests.clear_auth();
select is((select array_agg(c.k order by c.k) from nt join ctx c on c.v = nt.r where nt.title = 'Existencia baja: Arroz'), array['ana', 'bea', 'w1'], 'warehouse low: admins and handle_requests, not the actor nor store viewers');
select is((select count(*)::int from nt where title = 'Existencia baja: Arroz' and operation = 'low_stock' and priority = 'warning' and module = 'stock' and link = '/existencias' and store_id is null
  and body = format('Arroz en %s: 8 lb (mínimo 10)', (select name from locations where id = (select v from ctx where k = 'lw')))), 3, 'low notice content');
select is((select count(*)::int from nt where body ~* 'costo|[$]'), 0, 'notices carry no costs');
select tests.authenticate_as((select v from ctx where k = 'x1'), 'aal1', '00000000-0000-0000-0000-0000000005d1');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rw'))$$, 'write-off staying low');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_adjustment((select v from ctx where k = 'la'), 5, 'Recuento')$$, 'positive adjustment');
select tests.clear_auth();
select is((select count(*)::int from nt where title like '%Arroz'), 3, 'staying low and a positive adjustment do not notify');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_adjustment((select v from ctx where k = 'la'), -4, 'Conteo')$$, 'negative adjustment crossing the minimum');
select tests.clear_auth();
select is((select count(*)::int from nt where title = 'Existencia baja: Arroz' and r = (select v from ctx where k = 'x1')), 1, 'the actor of the first crossing is notified by the adjustment');
select is((select count(*)::int from nt where title = 'Existencia baja: Arroz'), 6, 'a negative adjustment crossing the minimum notifies');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e1', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 8, 'base')$$, 'transfer emptying the warehouse');
select tests.clear_auth();
select is((select array_agg(c.k order by c.k) from nt join ctx c on c.v = nt.r where nt.title = 'Agotado: Arroz'), array['bea', 'w1', 'x1'], 'low to out notifies');
select is((select count(*)::int from nt where title = 'Agotado: Arroz' and operation = 'out_of_stock' and priority = 'urgent'
  and body = format('Arroz en %s: 0 lb (mínimo 10)', (select name from locations where id = (select v from ctx where k = 'lw')))), 3, 'out notice content');
select is((select count(*)::int from nt where title like '%Arroz'), 9, 'the destination entry does not notify');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_transfer('00000000-0000-0000-0000-0000000000e3', (select v from ctx where k = 'lw'), (select v from ctx where k = 'l1'), 5, 'base')$$, 'transfer leaving the warehouse low');
select tests.clear_auth();
select is((select array_agg(c.k order by c.k) from nt join ctx c on c.v = nt.r where nt.title = 'Existencia baja: Sal'), array['bea', 'w1', 'x1'], 'a transfer leaving low notifies');

select tests.authenticate_as((select v from ctx where k = 'o3'), 'aal1', '00000000-0000-0000-0000-0000000005d3');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'l1'), 7, 'base', (select v from ctx where k = 'rw'))$$, 'store write-off crossing the minimum');
select tests.clear_auth();
select is((select array_agg(c.k order by c.k) from nt join ctx c on c.v = nt.r where nt.title = 'Existencia baja: Frijol'), array['ana', 'bea', 'v1'], 'store low: admins and viewers of that store only');
select is((select count(*)::int from nt where title = 'Existencia baja: Frijol' and store_id = '00000000-0000-0000-0000-0000000000f1' and priority = 'warning'), 3, 'store notice is scoped to the store');
select tests.authenticate_as((select v from ctx where k = 'o3'), 'aal1', '00000000-0000-0000-0000-0000000005d3');
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e2', (select v from ctx where k = 'l1'), 3, 'base', (select v from ctx where k = 'rw'))$$, 'store write-off to zero');
select tests.clear_auth();
select is((select array_agg(c.k order by c.k) from nt join ctx c on c.v = nt.r where nt.title = 'Agotado: Frijol'), array['ana', 'bea', 'v1'], 'store low to out notifies');

select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e4', (select v from ctx where k = 'lw'), 1, 'base', (select v from ctx where k = 'rw'))$$, 'write-off without a minimum');
select tests.clear_auth();
select is((select count(*)::int from nt where title like '%Azúcar'), 0, 'without a minimum nothing notifies above zero');
select tests.authenticate_as((select v from ctx where k = 'ana'));
select lives_ok($$select public.register_write_off('00000000-0000-0000-0000-0000000000e4', (select v from ctx where k = 'lw'), 2, 'base', (select v from ctx where k = 'rw'))$$, 'write-off to zero without a minimum');
select tests.clear_auth();
select is((select array_agg(c.k order by c.k) from nt join ctx c on c.v = nt.r where nt.title = 'Agotado: Azúcar'), array['bea', 'w1', 'x1'], 'without a minimum it notifies at zero');
select is((select body from nt where title = 'Agotado: Azúcar' limit 1), format('Azúcar en %s: 0 lb', (select name from locations where id = (select v from ctx where k = 'lw'))), 'no minimum part in the body');
select is((select count(*)::int from nt where title = 'Existencia baja: Azúcar'), 0, 'normal to out skips low');
select * from finish();
