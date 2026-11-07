select plan(6);

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Bu', 'bu01', tests.create_user('admin', 'bu-ana@test.dev'));
insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'P1');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true);

select lives_ok($$update product_stock_settings set base_unit = 'kg' where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'change allowed without history');
select is(app.product_has_history('00000000-0000-0000-0000-0000000000e1'), false, 'no history yet');

select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1',
  (select id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse'),
  'purchase', null, 5, 'kg', 1, null, null, current_date);

select is(app.product_has_history('00000000-0000-0000-0000-0000000000e1'), true, 'a lot is history');
select throws_ok($$update product_stock_settings set base_unit = 'g' where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'P0001', 'BASE_UNIT_LOCKED', 'blocked with a lot');
update lots set remaining = 0 where product_id = '00000000-0000-0000-0000-0000000000e1';
select throws_ok($$update product_stock_settings set base_unit = 'g' where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'P0001', 'BASE_UNIT_LOCKED', 'blocked with an emptied lot (movements remain)');
select lives_ok($$update product_stock_settings set base_unit = 'kg' where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'same unit allowed with history');

select tests.clear_auth();
select * from finish();
