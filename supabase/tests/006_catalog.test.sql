select plan(39);

create temp table ctx (k text primary key, v uuid);
grant all on ctx to public;

insert into ctx values
  ('ana', tests.create_user('admin', 'ana@test.dev')),
  ('cris', tests.create_user('admin', 'cris@test.dev')),
  ('dan', tests.create_user('admin', 'dan@test.dev'));

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Alfa', 'k7m2', (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', 'Beta', 'b2b2', (select v from ctx where k = 'dan')),
  ('00000000-0000-0000-0000-0000000000c3', 'Gama', 'g3g3', (select v from ctx where k = 'ana'));

insert into company_admins (company_id, admin_id, granted_by) values
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000a1', (select v from ctx where k = 'cris'), (select v from ctx where k = 'ana')),
  ('00000000-0000-0000-0000-0000000000b2', (select v from ctx where k = 'dan'), (select v from ctx where k = 'dan')),
  ('00000000-0000-0000-0000-0000000000c3', (select v from ctx where k = 'ana'), (select v from ctx where k = 'ana'));

insert into ctx values
  ('op1', tests.create_user('operator', 'viewer@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op2', tests.create_user('operator', 'creator@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op3', tests.create_user('operator', 'noview@test.dev', '00000000-0000-0000-0000-0000000000a1')),
  ('op4', tests.create_user('operator', 'full@test.dev', '00000000-0000-0000-0000-0000000000a1'));

insert into sites (id, company_id, name) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Norte');
insert into stores (id, company_id, site_id, name) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Caja 1');

insert into roles (id, owner_id, name) values
  ('00000000-0000-0000-0000-0000000000d1', (select v from ctx where k = 'ana'), 'Viewer'),
  ('00000000-0000-0000-0000-0000000000d2', (select v from ctx where k = 'ana'), 'Creator'),
  ('00000000-0000-0000-0000-0000000000d3', (select v from ctx where k = 'ana'), 'NoView'),
  ('00000000-0000-0000-0000-0000000000d4', (select v from ctx where k = 'ana'), 'Full');
insert into role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) values
  ('00000000-0000-0000-0000-0000000000d1', 'products', true, false, false, false),
  ('00000000-0000-0000-0000-0000000000d2', 'products', true, true, false, false),
  ('00000000-0000-0000-0000-0000000000d4', 'products', true, true, true, true);

insert into user_stores (user_id, store_id, company_id, role_id) values
  ((select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d1'),
  ((select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d2'),
  ((select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d3'),
  ((select v from ctx where k = 'op4'), '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000d4');

insert into app_sessions (session_id, user_id, active_store_id) values
  ('00000000-0000-0000-0000-0000000005a1', (select v from ctx where k = 'op1'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a2', (select v from ctx where k = 'op2'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a3', (select v from ctx where k = 'op3'), '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-0000000005a4', (select v from ctx where k = 'op4'), '00000000-0000-0000-0000-0000000000f1');

insert into categories (id, company_id, name) values
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-0000000000a1', 'Pan'),
  ('00000000-0000-0000-0000-000000000e03', '00000000-0000-0000-0000-0000000000a1', 'Lácteos'),
  ('00000000-0000-0000-0000-000000000e04', '00000000-0000-0000-0000-0000000000a1', 'Vacía');

select throws_ok($$insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', ' pan ')$$,
  '23505', null, 'Review Focus 4: " pan " collides with "Pan" in the same company');
select throws_ok($$insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'PAN')$$,
  '23505', null, 'Review Focus 4: "PAN" collides with "Pan" in the same company');
select lives_ok($$insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-0000000000b2', 'Pan')$$,
  'Review Focus 4: the same name is free in another company');
select throws_ok($$insert into products (company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e02', 'Baguette')$$,
  '23503', null, 'REQ-008 CA-05: a category of another company cannot be assigned');

insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-000000000f01', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e03', 'Leche');

select throws_ok($$update categories set deleted_at = now() where id = '00000000-0000-0000-0000-000000000e03'$$,
  'P0001', 'CATEGORY_HAS_PRODUCTS', 'REQ-008 CA-12: a category with live products cannot be deleted');
select lives_ok($$update categories set deleted_at = now() where id = '00000000-0000-0000-0000-000000000e04'$$,
  'a category without products can be deleted');
select throws_ok($$insert into products (company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e03', ' LECHE ')$$,
  '23505', null, 'Review Focus 4: product names collide ignoring case and spaces');

update products set deleted_at = now() where id = '00000000-0000-0000-0000-000000000f01';
select lives_ok($$insert into products (id, company_id, category_id, name) values ('00000000-0000-0000-0000-000000000f02', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e03', 'Leche')$$,
  'Review Focus 5: a deleted product frees its name');

insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000c3', 'Solo categoría');
select is(app.has_data('company', '00000000-0000-0000-0000-0000000000c3'), true, 'has_data(company) counts live categories');
update categories set deleted_at = now() where company_id = '00000000-0000-0000-0000-0000000000c3';
select is(app.has_data('company', '00000000-0000-0000-0000-0000000000c3'), false, 'has_data(company) ignores deleted categories');

select tests.authenticate_as((select v from ctx where k = 'op1'), 'aal1', '00000000-0000-0000-0000-0000000005a1');
select is((select count(*)::int from products where company_id = '00000000-0000-0000-0000-0000000000a1'), 1, 'Review Focus 5: an operator with view sees only live products');
select is((select count(*)::int from products where deleted_at is not null), 0, 'an operator never sees deleted products');
select is((select count(*)::int from categories), 2, 'an operator with view sees live categories of their company only');
select throws_ok($$insert into products (company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e03', 'Queso')$$,
  '42501', null, 'view without create cannot insert products');
select throws_ok($$insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Carnes')$$,
  '42501', null, 'an operator cannot write categories');
select lives_ok($$update products set deleted_at = now() where id = '00000000-0000-0000-0000-000000000f02'$$,
  'view without delete: soft delete is filtered silently');

select throws_ok($$select delete_product('00000000-0000-0000-0000-000000000f02')$$,
  '42501', null, 'view without delete cannot call delete_product');

select tests.authenticate_as((select v from ctx where k = 'op2'), 'aal1', '00000000-0000-0000-0000-0000000005a2');
select lives_ok($$insert into products (company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e03', 'Queso')$$,
  'create without edit: the insert succeeds');
select lives_ok($$update products set name = 'Queso 2' where name like 'Queso%'$$,
  'create without edit: the update is filtered silently');
select is((select name from products where name like 'Queso%'), 'Queso', 'create without edit: the name is unchanged');
select throws_ok($$insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Carnes')$$,
  '42501', null, 'create on products does not allow writing categories');

select tests.authenticate_as((select v from ctx where k = 'op3'), 'aal1', '00000000-0000-0000-0000-0000000005a3');
select is((select count(*)::int from products), 0, 'without view an operator sees 0 products');
select is((select count(*)::int from categories), 0, 'without view an operator sees 0 categories');

select tests.authenticate_as((select v from ctx where k = 'op4'), 'aal1', '00000000-0000-0000-0000-0000000005a4');
select throws_ok($$insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Carnes')$$,
  '42501', null, 'even with all product permissions an operator cannot create categories');
select lives_ok($$update categories set name = 'Hackeada' where id = '00000000-0000-0000-0000-000000000e01'$$,
  'an operator category update is filtered silently');
select is((select name from categories where id = '00000000-0000-0000-0000-000000000e01'), 'Pan', 'the category name is unchanged');
select lives_ok($$update products set name = 'Queso 2' where name like 'Queso%'$$, 'edit permission updates a product');
select is((select name from products where name like 'Queso%'), 'Queso 2', 'the product name changed');
select throws_ok($$update products set company_id = '00000000-0000-0000-0000-0000000000b2' where name like 'Queso%'$$,
  '42501', null, 'products.company_id is immutable');
select throws_ok($$update products set deleted_at = now() where name like 'Queso%'$$,
  '42501', null, 'a direct soft delete by an operator is rejected');
select lives_ok($$select delete_product((select id from products where name like 'Queso%'))$$, 'delete permission soft-deletes a product');
select is((select count(*)::int from products where name like 'Queso%'), 0, 'the soft-deleted product disappears for the operator');

select tests.authenticate_as((select v from ctx where k = 'dan'));
select is((select count(*)::int from categories where company_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'an admin of another company sees no categories');
select is((select count(*)::int from products where company_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'an admin of another company sees no products');

select tests.authenticate_as((select v from ctx where k = 'cris'));
select is((select count(*)::int from categories where company_id = '00000000-0000-0000-0000-0000000000a1'), 3, 'an admin sees all categories of the company, deleted included');
select lives_ok($$insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000a1', 'Carnes')$$, 'an admin creates categories');
select lives_ok($$insert into products (company_id, category_id, name) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000e03', 'Yogur')$$, 'an admin creates products');
select throws_ok($$update categories set company_id = '00000000-0000-0000-0000-0000000000b2' where id = '00000000-0000-0000-0000-000000000e01'$$,
  '42501', null, 'categories.company_id is immutable');
select throws_ok($$insert into categories (company_id, name) values ('00000000-0000-0000-0000-0000000000b2', 'Ajena')$$,
  '42501', null, 'an admin cannot create categories in a company they do not administer');

select tests.clear_auth();
select * from finish();
