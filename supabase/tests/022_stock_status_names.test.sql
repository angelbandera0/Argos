select plan(20);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'sn-ana@test.dev')),
  ('dan', tests.create_user('admin', 'sn-dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000002200a1', 'AlfaN', 'sn7a', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000002200b2', 'BetaN', 'sn7b', (select v from ctx where k = 'dan'));
insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000002200a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000002200b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan'));

insert into ctx values
  ('sv', tests.create_user('operator', 'sn-sv@test.dev', '00000000-0000-0000-0000-0000002200a1')),
  ('nv', tests.create_user('operator', 'sn-nv@test.dev', '00000000-0000-0000-0000-0000002200a1'));

insert into sites (id, company_id, name) values ('00000000-0000-0000-0000-0000002200c1', '00000000-0000-0000-0000-0000002200a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000002200f1', '00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200c1', 'Caja 1');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000002200d1', (select v from ctx where k = 'ana'), 'SoloStock'),
  ('00000000-0000-0000-0000-0000002200d2', (select v from ctx where k = 'ana'), 'SinStock');
insert into role_permissions (role_id, module, can_view) values
  ('00000000-0000-0000-0000-0000002200d1', 'stock', true),
  ('00000000-0000-0000-0000-0000002200d2', 'sales', true);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'sv'), '00000000-0000-0000-0000-0000002200f1', '00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200d1'),
  ((select v from ctx where k = 'nv'), '00000000-0000-0000-0000-0000002200f1', '00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200d2');
insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000002205d1', (select v from ctx where k = 'sv'), '00000000-0000-0000-0000-0000002200f1'),
  ('00000000-0000-0000-0000-0000002205d2', (select v from ctx where k = 'nv'), '00000000-0000-0000-0000-0000002200f1');

insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000002200ca', '00000000-0000-0000-0000-0000002200a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000002200e1', '00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200ca', 'Arroz'),
  ('00000000-0000-0000-0000-0000002200e2', '00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200ca', 'Frijol'),
  ('00000000-0000-0000-0000-0000002200e3', '00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200ca', 'Sal');
insert into product_stock_settings (product_id, company_id, storable)
select p.id, p.company_id, true from products p where p.company_id = '00000000-0000-0000-0000-0000002200a1';

insert into ctx select 'lw', id from locations where company_id = '00000000-0000-0000-0000-0000002200a1' and kind = 'warehouse';
insert into ctx select 'l1', id from locations where store_id = '00000000-0000-0000-0000-0000002200f1';

insert into ctx values
  ('la', app.create_lot('00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200e1', (select v from ctx where k = 'lw'), 'initial_entry', null, 20, 'lb', 1, null, null, date '2026-01-01')),
  ('lf', app.create_lot('00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200e2', (select v from ctx where k = 'l1'), 'direct_entry', null, 10, 'lb', 1, null, null, date '2026-01-01')),
  ('ls', app.create_lot('00000000-0000-0000-0000-0000002200a1', '00000000-0000-0000-0000-0000002200e3', (select v from ctx where k = 'lw'), 'initial_entry', null, 5, 'lb', 1, null, null, date '2026-01-01'));

update products set deleted_at = now() where id = '00000000-0000-0000-0000-0000002200e2';

select tests.authenticate_as((select v from ctx where k = 'ana'));
select is((select product_name from stock_status where product_id = '00000000-0000-0000-0000-0000002200e1'), 'Arroz', 'an admin sees the product name');
select is((select category_name from stock_status where product_id = '00000000-0000-0000-0000-0000002200e1'), 'Granos', 'an admin sees the category name');
select is((select category_id from stock_status where product_id = '00000000-0000-0000-0000-0000002200e1'), '00000000-0000-0000-0000-0000002200ca'::uuid, 'an admin sees the category id');
select is((select product_name from stock_status where product_id = '00000000-0000-0000-0000-0000002200e2'), 'Frijol', 'a logically deleted product keeps its name');
select is((select array_agg(n) from (select product_name n from stock_status where product_id in ('00000000-0000-0000-0000-0000002200e1', '00000000-0000-0000-0000-0000002200e2', '00000000-0000-0000-0000-0000002200e3') order by product_name) t), array['Arroz', 'Frijol', 'Sal'], 'ordering by product_name works');
select is((select array_agg(column_name::text order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'stock_status'),
  array['company_id', 'product_id', 'location_id', 'quantity', 'minimum', 'status', 'product_name', 'category_id', 'category_name'], 'old columns keep their order and the new ones come last');
select is((select status from stock_status where product_id = '00000000-0000-0000-0000-0000002200e1'), 'normal', 'status is still computed');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'sv'), 'aal1', '00000000-0000-0000-0000-0000002205d1');
select is(app.can('00000000-0000-0000-0000-0000002200a1', 'products', 'view'), false, 'the stock viewer cannot view products');
select is((select count(*)::int from products where company_id = '00000000-0000-0000-0000-0000002200a1'), 0, 'products stay hidden to the stock viewer');
select is((select product_name from stock_status where product_id = '00000000-0000-0000-0000-0000002200e2' and location_id = (select v from ctx where k = 'l1')), 'Frijol', 'the stock viewer sees the product name of their store');
select is((select category_name from stock_status where product_id = '00000000-0000-0000-0000-0000002200e2' and location_id = (select v from ctx where k = 'l1')), 'Granos', 'the stock viewer sees the category name');
select is((select category_id from stock_status where product_id = '00000000-0000-0000-0000-0000002200e2' and location_id = (select v from ctx where k = 'l1')), '00000000-0000-0000-0000-0000002200ca'::uuid, 'the stock viewer sees the category id');
select is((select product_name from stock_status where product_id = '00000000-0000-0000-0000-0000002200e3'), 'Sal', 'the stock viewer sees names in the warehouse');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'nv'), 'aal1', '00000000-0000-0000-0000-0000002205d2');
select is((select count(*)::int from stock_status where company_id = '00000000-0000-0000-0000-0000002200a1'), 0, 'an operator without stock view gets no rows');
select is(app.product_label('00000000-0000-0000-0000-0000002200e1'), null, 'an operator without stock view gets no name');
select tests.clear_auth();

select tests.authenticate_as((select v from ctx where k = 'dan'));
select is(app.product_label('00000000-0000-0000-0000-0000002200e1'), null, 'another company gets no product name');
select is(app.product_category_label('00000000-0000-0000-0000-0000002200e1'), null, 'another company gets no category name');
select is(app.product_category_id('00000000-0000-0000-0000-0000002200e1'), null, 'another company gets no category id');
select tests.clear_auth();

select is(has_function_privilege('anon', 'app.product_label(uuid)', 'execute') or has_function_privilege('anon', 'app.product_category_id(uuid)', 'execute') or has_function_privilege('anon', 'app.product_category_label(uuid)', 'execute'), false, 'anon cannot execute the label functions');
select is(has_function_privilege('authenticated', 'app.product_label(uuid)', 'execute') and has_function_privilege('authenticated', 'app.product_category_id(uuid)', 'execute') and has_function_privilege('authenticated', 'app.product_category_label(uuid)', 'execute'), true, 'authenticated can execute the label functions');
select * from finish();
