select plan(4);

insert into companies (id, name, code, founder_id) values
  ('00000000-0000-0000-0000-0000000000a1', 'Sl', 'sl01', tests.create_user('admin', 'sl-ana@test.dev'));
insert into categories (id, company_id, name) values ('00000000-0000-0000-0000-0000000000ca', '00000000-0000-0000-0000-0000000000a1', 'Granos');
insert into products (id, company_id, category_id, name) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000ca', 'P1');
insert into product_stock_settings (product_id, company_id, storable) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000a1', true);

select lives_ok($$update product_stock_settings set storable = false where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'deactivate allowed without history');
update product_stock_settings set storable = true where product_id = '00000000-0000-0000-0000-0000000000e1';

select app.create_lot('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1',
  (select id from locations where company_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'warehouse'),
  'purchase', null, 5, 'lb', 1, null, null, current_date);

select throws_ok($$update product_stock_settings set storable = false where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'P0001', 'STORABLE_LOCKED', 'blocked with a lot');
update lots set remaining = 0 where product_id = '00000000-0000-0000-0000-0000000000e1';
select throws_ok($$update product_stock_settings set storable = false where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'P0001', 'STORABLE_LOCKED', 'blocked with an emptied lot');
select lives_ok($$update product_stock_settings set storable = true where product_id = '00000000-0000-0000-0000-0000000000e1'$$, 'staying storable allowed');

select tests.clear_auth();
select * from finish();
